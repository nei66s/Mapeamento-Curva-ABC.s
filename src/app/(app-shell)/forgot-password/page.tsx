import ForgotPasswordForm from "@/components/ForgotPasswordForm"

export const metadata = {
  title: 'Esqueci a senha',
}

export default function Page() {
  return (
    <main className="p-6">
      <h1>Esqueci a senha</h1>
      <p>Informe o e-mail associado à sua conta para receber instruções.</p>
      <ForgotPasswordForm />
    </main>
  )
}
