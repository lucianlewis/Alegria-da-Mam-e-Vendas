import React from 'react';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Scale } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="m3-headline-small flex-1 ml-2">{t('termsOfService')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-12">
        <div className="space-y-4">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText size={24} />
          </div>
          <h2 className="m3-headline-medium">Termos de Uso</h2>
          <p className="m3-body-medium text-slate-500 leading-relaxed">
            Bem-vindo ao nosso aplicativo de gestão de vendas. Ao acessar ou utilizar nossa plataforma, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.
          </p>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <CheckCircle size={20} className="text-primary" />
              1. Aceitação dos Termos
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              O uso deste aplicativo é condicionado à aceitação total destes termos. Se você não concordar com qualquer parte, não deve utilizar o serviço. Estes termos aplicam-se a todos os usuários, incluindo administradores e vendedores.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <AlertTriangle size={20} className="text-primary" />
              2. Funcionalidades e Uso do App
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              O aplicativo oferece ferramentas para registro de vendas, gestão de metas, controle de caixa e análise de desempenho. O uso das funcionalidades deve ser estritamente profissional e ético, sendo proibido o uso para fins ilícitos ou que violem a integridade dos dados financeiros da empresa.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <Scale size={20} className="text-primary" />
              3. Responsabilidades do Usuário
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              Você é responsável por manter a confidencialidade de suas credenciais de acesso. Qualquer atividade realizada sob sua conta será de sua inteira responsabilidade. É proibido compartilhar senhas ou permitir o acesso de terceiros não autorizados à plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <CheckCircle size={20} className="text-primary" />
              4. Regras Financeiras e de Dados
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              Todos os lançamentos financeiros devem refletir a realidade das operações. O sistema registra logs de atividades para auditoria. Tentativas de manipulação de dados, fraudes em metas ou registros falsos de vendas resultarão em suspensão imediata da conta e possíveis medidas administrativas.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <AlertTriangle size={20} className="text-primary" />
              5. Limitação de Responsabilidade
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              Embora busquemos a máxima disponibilidade e precisão, não nos responsabilizamos por perdas decorrentes de falhas técnicas externas, mau uso do sistema ou decisões de negócio baseadas exclusivamente nos dados apresentados, que devem ser conferidos periodicamente.
            </p>
          </section>
        </div>

        <footer className="pt-8 border-t border-[var(--border-color)] text-center">
          <p className="m3-label-small text-slate-500 uppercase tracking-widest">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </footer>
      </main>
    </div>
  );
};
