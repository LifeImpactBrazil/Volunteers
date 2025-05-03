'use client';

import { useState } from 'react';
import InputMask from 'react-input-mask';
import { supabase } from '../../lib/supabaseClient';

function validateCPF(cpf: string): boolean {
  const str = cpf.replace(/\D+/g, '');
  if (str.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(str)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(str[i]) * (10 - i);
  let check = (sum * 10) % 11; if (check === 10) check = 0;
  if (check !== parseInt(str[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(str[i]) * (11 - i);
  check = (sum * 10) % 11; if (check === 10) check = 0;
  if (check !== parseInt(str[10])) return false;

  return true;
}

export default function Register() {
  const daysOfWeek = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
  const unidades = [
    'Rio de Janeiro - CDD',
    'Rio de Janeiro - Gardênia',
    'Amazonas',
    'Ceará'
  ];
  const maritalOptions = ['solteiro','casado','divorciado','viúvo'];
  const workshopsList = [
    'Organização bazar','Cozinha','Ajudante em oficina de Língua portuguesa',
    'Ajudante em oficina de Matemática','Futebol','Balé','De leitura','De letramento',
    'Informática','Língua inglesa','Língua espanhola','Artesanato',
    'Ministrar oficina de lutas','Ajuda em eventos (Dia das mães, pais, Páscoa, Natal, ...)',
    'Outros (especificar)'
  ];
  const rjUnits = ['Rio de Janeiro - CDD','Rio de Janeiro - Gardênia'];
  const brazilStates = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
    'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ];

  const [form, setForm] = useState<any>({
    full_name: '', cpf: '', email: '', phone: '',
    religion: '', marital_status: '',
    unidade: '', street: '', number: '', complement: '',
    district: '', city: '', state: '', cep: '',
    hours_per_week: '', days: [] as string[],
    specialties: '', about: '',
    workshops: [] as string[], workshop_other: ''
  });
  const [status, setStatus] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, checked } = e.target as any;
    if (name === 'days' || name === 'workshops') {
      const arr = form[name] || [];
      setForm({
        ...form,
        [name]: checked
          ? [...arr, value]
          : arr.filter((v: string) => v !== value)
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.days.length) {
      setStatus('Selecione pelo menos um dia de atuação.');
      return;
    }
    if (!validateCPF(form.cpf)) {
      setStatus('CPF inválido');
      return;
    }
    setStatus('Enviando…');
    // ... montagem do doc, geração do embedding e insert no Supabase ...
  };

  const baseInputClasses = `
    block w-full rounded-lg border border-gray-300
    bg-white bg-opacity-80 px-4 py-3 placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-green-500
    transition
  `;

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="
        bg-white bg-opacity-70 backdrop-blur-lg shadow-xl
        rounded-2xl p-8 max-w-lg w-full mx-4
      ">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-green-800">
          Formulário de Voluntário
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nome completo */}
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Nome completo"
            className={baseInputClasses}
            required
          />

          {/* CPF */}
          <InputMask
            mask="999.999.999-99"
            maskChar={null}
            name="cpf"
            value={form.cpf}
            onChange={handleChange}
          >
            {(inputProps: any) => (
              <input
                {...inputProps}
                placeholder="CPF (000.000.000-00)"
                className={baseInputClasses}
                required
              />
            )}
          </InputMask>

          {/* Email */}
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="seu@exemplo.com"
            className={baseInputClasses}
            required
          />

          {/* Telefone */}
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="99 9999-9999 ou 99 99999-9999"
            pattern="^\d{2}\s\d{4,5}-\d{4}$"
            title="Formato: 99 9999-9999 ou 99 99999-9999"
            className={baseInputClasses}
            required
          />

          {/* Fé / Religião */}
          <input
            name="religion"
            value={form.religion}
            onChange={handleChange}
            placeholder="Fé / Religião"
            className={baseInputClasses}
            required
          />

          {/* Estado civil */}
          <select
            name="marital_status"
            value={form.marital_status}
            onChange={handleChange}
            className={baseInputClasses}
            required
          >
            <option value="">Estado civil</option>
            {maritalOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {/* Unidade */}
          <select
            name="unidade"
            value={form.unidade}
            onChange={handleChange}
            className={baseInputClasses}
            required
          >
            <option value="">Selecione a unidade</option>
            {unidades.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {/* Oficinas (somente RJ) */}
          {rjUnits.includes(form.unidade) && (
            <fieldset className="space-y-2">
              <legend className="font-semibold text-gray-700">Oficinas</legend>
              <div className="flex flex-wrap gap-3">
                {workshopsList.map(w => (
                  <label key={w} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="workshops"
                      value={w}
                      checked={form.workshops.includes(w)}
                      onChange={handleChange}
                      className="h-5 w-5 text-green-600"
                    />
                    <span className="text-gray-800">{w}</span>
                  </label>
                ))}
              </div>
              {form.workshops.includes('Outros (especificar)') && (
                <input
                  name="workshop_other"
                  value={form.workshop_other}
                  onChange={handleChange}
                  placeholder="Especifique outras oficinas"
                  className={`${baseInputClasses} mt-2`}
                />
              )}
            </fieldset>
          )}

          {/* Especialidades */}
          <textarea
            name="specialties"
            value={form.specialties}
            onChange={handleChange}
            placeholder="Especialidades (separe por vírgula)"
            className={`${baseInputClasses} h-24 resize-none`}
          />

          {/* Fale sobre você */}
          <textarea
            name="about"
            value={form.about}
            onChange={handleChange}
            placeholder="Fale sobre você"
            className={`${baseInputClasses} h-40 resize-y`}
            required
          />

          {/* Endereço */}
          <div className="grid grid-cols-2 gap-4">
            <input
              name="street"
              value={form.street}
              onChange={handleChange}
              placeholder="Rua"
              className={baseInputClasses}
              required
            />
            <input
              name="number"
              value={form.number}
              onChange={handleChange}
              placeholder="Número"
              className={baseInputClasses}
              required
            />
            <input
              name="complement"
              value={form.complement}
              onChange={handleChange}
              placeholder="Complemento"
              className={baseInputClasses}
            />
            <input
              name="district"
              value={form.district}
              onChange={handleChange}
              placeholder="Bairro"
              className={baseInputClasses}
              required
            />
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Cidade"
              className={baseInputClasses}
              required
            />
            <select
              name="state"
              value={form.state}
              onChange={handleChange}
              className={baseInputClasses}
              required
            >
              <option value="">UF</option>
              {brazilStates.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
            <InputMask
              mask="99999-999"
              maskChar={null}
              name="cep"
              value={form.cep}
              onChange={handleChange}
            >
              {(inputProps: any) => (
                <input
                  {...inputProps}
                  placeholder="CEP (00000-000)"
                  className={baseInputClasses}
                  required
                />
              )}
            </InputMask>
            <input
              name="hours_per_week"
              type="number"
              value={form.hours_per_week}
              onChange={handleChange}
              placeholder="Horas/semana"
              className={baseInputClasses}
              min={1}
              required
            />
          </div>

          {/* Dias da semana */}
          <fieldset className="flex flex-wrap gap-3">
            {daysOfWeek.map(d => (
              <label key={d} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="days"
                  value={d}
                  checked={form.days.includes(d)}
                  onChange={handleChange}
                  className="h-5 w-5 text-green-600"
                />
                <span className="text-gray-800 capitalize">{d}</span>
              </label>
            ))}
          </fieldset>

          {/* Submit */}
          <button
            type="submit"
            className="
              w-full bg-green-600 hover:bg-green-700
              text-white font-semibold py-3 rounded-lg
              shadow-md transition
            "
          >
            Enviar
          </button>
        </form>

        {status && (
          <p className="mt-4 text-center text-lg font-medium text-gray-700">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
