import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col">
      <header className="sticky top-0 z-10 flex items-center bg-[var(--bg-color)] p-4 border-b border-[var(--border-color)]">
        <button onClick={onBack} className="text-[var(--text-color)] flex size-10 items-center justify-center hover:bg-[var(--card-bg)] rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="m3-headline-small flex-1 ml-2">{t('privacyPolicy')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-12">
        <div className="space-y-4">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield size={24} />
          </div>
          <h2 className="m3-headline-medium">Política de Privacidade</h2>
          <p className="m3-body-medium text-slate-500 leading-relaxed">
            Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações ao utilizar nosso aplicativo, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <Eye size={20} className="text-primary" />
              1. Coleta de Dados
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              Coletamos dados necessários para a operação do sistema e identificação do usuário, tais como:
            </p>
            <ul className="space-y-2 pl-4">
              {[
                { key: 'fullName', label: 'Nome Completo' },
                { key: 'email', label: 'Endereço de E-mail' },
                { key: 'salesData', label: 'Registros de Vendas e Transações' },
                { key: 'inventoryData', label: 'Dados de Metas e Desempenho' },
                { key: 'authData', label: 'Informações de Autenticação (Firebase Auth)' }
              ].map(item => (
                <li key={item.key} className="flex items-center gap-2 m3-body-small text-slate-400">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {item.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <Lock size={20} className="text-primary" />
              2. Uso e Tratamento de Dados
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              Os dados coletados são utilizados exclusivamente para:
              <br />• Autenticação e segurança da conta;
              <br />• Processamento e histórico de vendas;
              <br />• Cálculo de comissões e acompanhamento de metas;
              <br />• Auditoria interna e prevenção de fraudes financeiras.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              3. Segurança e Proteção
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              Utilizamos infraestrutura de nuvem segura (Firebase/Google Cloud) com criptografia em trânsito e em repouso. O acesso aos dados é restrito por regras de segurança rigorosas (Firestore Security Rules), garantindo que cada usuário acesse apenas as informações permitidas pelo seu nível de acesso (Vendedor ou Administrador).
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <CheckCircle size={20} className="text-primary" />
              4. Conformidade com a LGPD
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              Garantimos aos usuários os direitos previstos na LGPD, incluindo:
              <br />• Acesso aos seus dados pessoais;
              <br />• Correção de dados incompletos ou inexatos;
              <br />• Exclusão de dados (conforme políticas de retenção legal);
              <br />• Portabilidade das informações.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="m3-title-large flex items-center gap-2">
              <Lock size={20} className="text-primary" />
              5. Dados Sensíveis e Financeiros
            </h3>
            <p className="m3-body-medium text-slate-500 leading-relaxed">
              Não coletamos dados biométricos ou de saúde. Dados financeiros limitam-se ao registro de transações de venda da empresa. Informações de pagamento (como números de cartão) não são processadas ou armazenadas diretamente em nossos servidores, sendo delegadas a provedores de pagamento externos quando aplicável.
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
