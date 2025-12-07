import ForgotPasswordForm from "@/components/ForgotPasswordForm"

export const metadata = {
  title: 'Esqueci a senha',
}

export default function Page() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Esqueci a senha</h1>
      <p>Informe o e-mail associado à sua conta para receber instruções.</p>
      <ForgotPasswordForm />
    </main>
  )
}
