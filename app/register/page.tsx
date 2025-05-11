// app/register/page.tsx
'use client';

import { useState } from 'react';
import InputMask from 'react-input-mask';
import { supabase } from '../../lib/supabaseClient';

/* ---------- limites ---------- */
const MAX_NAME            = 220;
const MAX_EMAIL           = 220;
const MAX_PHONE           = 30;
const MAX_RELIGION        = 200;
const MAX_SPECIALTIES     = 900;
const MAX_ABOUT           = 5000;
const MAX_ADDRESS_FIELD   = 200;
const MAX_WORKSHOP_OTHER  = 400;

/* ---------- util CPF ---------- */
function validateCPF(cpf: string): boolean {
  const str = cpf.replace(/\D+/g, '');
  if (str.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(str)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += +str[i] * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== +str[9]) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += +str[i] * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === +str[10];
}

export default function Register() {
  /* ---------- listas fixas ---------- */
  const daysOfWeek   = ['segunda','terça','quarta','quinta','sexta','sábado'];
  const unidades     = ['Rio de Janeiro - CDD','Rio de Janeiro - Gardênia','Amazonas','Ceará'];
  const maritalOpts  = ['Solteiro(a)','Casado(a)','Divorciado(a)','Viúvo(a)'];
  const workshopsLst = [
    'Organização bazar','Cozinha','Ajudante em oficina de Língua portuguesa',
    'Ajudante em oficina de Matemática','Futebol','Balé','De leitura','De letramento',
    'Informática','Língua inglesa','Língua espanhola','Artesanato',
    'Ministrar oficina de lutas','Ajuda em eventos (Dia das mães, pais, Páscoa, Natal, ...)',
    'Outros (especificar)'
  ];
  const rjUnits = ['Rio de Janeiro - CDD','Rio de Janeiro - Gardênia'];
  const brazilUF = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
    'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ];

  /* ---------- estado ---------- */
  const [form, setForm] = useState<any>({
    full_name:'', cpf:'', email:'', phone:'', age:'', religion:'',
    marital_status:'', unidade:'',
    street:'', number:'', complement:'', district:'', city:'', state:'', cep:'',
    hours_per_week:'', days:[], specialties:'', about:'',
    workshops:[], workshop_other:''
  });
  const [status, setStatus] = useState('');

  /* ---------- handleChange ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>
  ) => {
    const { name, value, checked } = e.target as any;

    if (name === 'days' || name === 'workshops') {
      setForm((prev: any) => {
        const arr = prev[name] || [];
        return {
          ...prev,
          [name]: checked ? [...arr, value] : arr.filter((v: string) => v !== value)
        };
      });
    } else {
      setForm((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  /* ---------- handleSubmit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    /* limites de caracteres */
    if (form.full_name.length      > MAX_NAME)           { setStatus(`Nome ≤ ${MAX_NAME}`);             return; }
    if (form.specialties.length    > MAX_SPECIALTIES)    { setStatus(`Especialidades ≤ ${MAX_SPECIALTIES}`); return; }
    if (form.about.length          > MAX_ABOUT)          { setStatus(`"Sobre" ≤ ${MAX_ABOUT}`);         return; }
    if (form.workshop_other.length > MAX_WORKSHOP_OTHER) { setStatus(`Outros ≤ ${MAX_WORKSHOP_OTHER}`); return; }

    /* validações já existentes */
    if (!form.days.length)                { setStatus('Selecione pelo menos um dia.'); return; }
    if (!validateCPF(form.cpf))           { setStatus('CPF inválido.');                return; }
    if (form.age === '' || +form.age < 0) { setStatus('Idade inválida.');              return; }

    setStatus('Enviando…');

    try {
      const specialtiesArr = form.specialties
        .split(',')
        .map((s:string)=>s.trim())
        .filter(Boolean);

      const createdAt = new Date().toISOString();

      /* texto p/ embedding */
      const textToEmbed = [
        `Nome: ${form.full_name}`,
        `CPF: ${form.cpf}`,
        `Idade: ${form.age}`,
        `Religião: ${form.religion}`,
        `Estado civil: ${form.marital_status}`,
        `Unidade: ${form.unidade}`,
        `Endereço: ${form.street}, ${form.district}, ${form.city}-${form.state}, CEP ${form.cep}`,
        `Horas/semana: ${form.hours_per_week}`,
        `Dias: ${form.days.join(', ')}`,
        `Especialidades: ${specialtiesArr.join(', ')}`,
        `Sobre: ${form.about}`,
        form.workshops.length ? `Oficinas: ${form.workshops.join(', ')}` : '',
        form.workshop_other ? `Outra oficina: ${form.workshop_other}` : '',
        `Criado em: ${createdAt}`
      ].filter(Boolean).join('\n');

      /* gera embedding */
      const embRes = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToEmbed })
      });
      if (!embRes.ok) throw new Error(await embRes.text());
      const about_embedding = await embRes.json();

      /* prepara payload */
      const payload = {
        ...form,
        age: +form.age,
        specialties: specialtiesArr,
        about_embedding,
        workshop_other: form.workshops.includes('Outros (especificar)')
          ? form.workshop_other : null,
        created_at: createdAt
      };

      const { error } = await supabase.from('volunteers').insert(payload);
      if (error) throw error;

      setStatus('Enviado com sucesso! 🎉');
      setForm({
        full_name:'', cpf:'', email:'', phone:'', age:'', religion:'',
        marital_status:'', unidade:'',
        street:'', number:'', complement:'', district:'', city:'', state:'', cep:'',
        hours_per_week:'', days:[], specialties:'', about:'',
        workshops:[], workshop_other:''
      });
    } catch (err:any) {
      setStatus('Erro: ' + err.message);
    }
  };

  /* ---------- classes ---------- */
  const baseInput = `
    block w-full rounded-lg border border-gray-300 bg-white bg-opacity-80
    px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2
    focus:ring-green-500 transition`;
  const smallPH = 'placeholder:text-xs sm:placeholder:text-sm';

  /* ---------- JSX ---------- */
  return (
    <div className="flex items-center justify-center min-h-screen bg-cover bg-center"
         style={{ backgroundImage:"url('/background.jpg')" }}>
      <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl p-8 max-w-lg w-full mx-4">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-green-800">
          Formulário de Voluntário
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <input name="full_name" value={form.full_name} onChange={handleChange}
                 placeholder="Nome completo" maxLength={MAX_NAME}
                 className={baseInput} required/>

          {/* CPF */}
          <InputMask mask="999.999.999-99" maskChar={null}
                     name="cpf" value={form.cpf} onChange={handleChange}>
            {(props)=><input {...props} placeholder="CPF (000.000.000-00)"
                             className={baseInput} required/>}
          </InputMask>

          {/* Email */}
          <input name="email" type="email" value={form.email} onChange={handleChange}
                 placeholder="seu@exemplo.com" maxLength={MAX_EMAIL}
                 className={baseInput} required/>

          {/* Telefone (regex com espaço opcional) */}
          <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                 placeholder="Tel (99)9999-9999 ou (99)99999-9999"
                 pattern="^\(\d{2}\)\s?\d{4,5}-\d{4}$"
                 title="Formato: (99)9999-9999 ou (99)99999-9999"
                 maxLength={MAX_PHONE}
                 className={`${baseInput} ${smallPH}`} required/>

          {/* Idade */}
          <input name="age" type="number" value={form.age} onChange={handleChange}
                 placeholder="Idade" min={0} className={baseInput} required/>

          {/* Religião */}
          <input name="religion" value={form.religion} onChange={handleChange}
                 placeholder="Religião / Igreja" maxLength={MAX_RELIGION}
                 className={baseInput} required/>

          {/* Estado civil */}
          <select name="marital_status" value={form.marital_status} onChange={handleChange}
                  className={baseInput} required>
            <option value="">Estado civil</option>
            {maritalOpts.map(opt=>(
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {/* Unidade */}
          <select name="unidade" value={form.unidade} onChange={handleChange}
                  className={baseInput} required>
            <option value="">Selecione a unidade</option>
            {unidades.map(u=><option key={u} value={u}>{u}</option>)}
          </select>

          {/* Workshops se RJ */}
          {rjUnits.includes(form.unidade) && (
            <fieldset className="space-y-2">
              <legend className="font-semibold text-gray-700">Oficinas / Áreas:</legend>
              <div className="flex flex-wrap gap-3">
                {workshopsLst.map(w=>(
                  <label key={w} className="flex items-center gap-2">
                    <input type="checkbox" name="workshops" value={w}
                           checked={form.workshops.includes(w)} onChange={handleChange}
                           className="h-5 w-5 text-green-600"/>
                    <span>{w}</span>
                  </label>
                ))}
              </div>
              {form.workshops.includes('Outros (especificar)') && (
                <input name="workshop_other" value={form.workshop_other} onChange={handleChange}
                       placeholder="Especifique outras oficinas" maxLength={MAX_WORKSHOP_OTHER}
                       className={baseInput}/>
              )}
            </fieldset>
          )}

          {/* Especialidades */}
          <textarea name="specialties" value={form.specialties} onChange={handleChange}
            placeholder="Especialidades (separe por vírgula)"
            className={`${baseInput} h-24 resize-none`} maxLength={MAX_SPECIALTIES}/>

          {/* Sobre */}
          <div>
            <textarea name="about" value={form.about} onChange={handleChange}
              placeholder="Fale sobre você"
              className={`${baseInput} h-40 resize-y`} maxLength={MAX_ABOUT} required/>
            <p className="text-right text-xs text-gray-500">{form.about.length}/{MAX_ABOUT}</p>
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-2 gap-4">
            <input name="street" value={form.street} onChange={handleChange}
                   placeholder="Rua" maxLength={MAX_ADDRESS_FIELD}
                   className={baseInput} required/>
            <input name="number" value={form.number} onChange={handleChange}
                   placeholder="Número" maxLength={20}
                   className={baseInput} required/>
            <input name="complement" value={form.complement} onChange={handleChange}
                   placeholder="Complemento" maxLength={MAX_ADDRESS_FIELD}
                   className={baseInput}/>
            <input name="district" value={form.district} onChange={handleChange}
                   placeholder="Bairro" maxLength={MAX_ADDRESS_FIELD}
                   className={baseInput} required/>
            <input name="city" value={form.city} onChange={handleChange}
                   placeholder="Cidade" maxLength={MAX_ADDRESS_FIELD}
                   className={baseInput} required/>
            <select name="state" value={form.state} onChange={handleChange}
                    className={baseInput} required>
              <option value="">UF</option>
              {brazilUF.map(uf=><option key={uf} value={uf}>{uf}</option>)}
            </select>

            {/* CEP */}
            <InputMask mask="99999-999" maskChar={null}
                       name="cep" value={form.cep} onChange={handleChange}>
              {(props)=><input {...props} placeholder="CEP (00000-000)"
                               className={`${baseInput} ${smallPH}`} required/>}
            </InputMask>
          </div>

          {/* Disponibilidade */}
          <div className="space-y-2">
            <label className="font-semibold text-gray-700">Disponibilidade:</label>
            <div className="grid grid-cols-2 gap-4">
              <input name="hours_per_week" type="number" value={form.hours_per_week}
                     onChange={handleChange} placeholder="Horas/semana"
                     className={`${baseInput} ${smallPH}`} min={1} required/>
              <div />
            </div>

            <fieldset className="flex flex-wrap gap-3">
              {daysOfWeek.map(d=>(
                <label key={d} className="flex items-center gap-2">
                  <input type="checkbox" name="days" value={d}
                         checked={form.days.includes(d)} onChange={handleChange}
                         className="h-5 w-5 text-green-600"/>
                  <span className="capitalize">{d}</span>
                </label>
              ))}
            </fieldset>
          </div>

          <button type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow-md transition">
            Enviar
          </button>
        </form>

        {status && <p className="mt-4 text-center text-lg font-medium text-gray-700">{status}</p>}
      </div>
    </div>
  );
}
