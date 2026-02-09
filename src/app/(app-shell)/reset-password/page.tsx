import ResetPasswordForm from "@/components/ResetPasswordForm"

export const metadata = {
  title: 'Redefinir senha',
}

// This page reads ?token=... from the URL and passes it to the client form
export default async function Page({ searchParams }: { searchParams?: any }) {
  const sp = await searchParams;
  const token = sp?.token ?? null
  const returnTo = sp?.returnTo ?? null
  return (
    <main className="p-6">
      <h1>Redefinir senha</h1>
      {!token && <p>Se você recebeu um link por e-mail, abra-o aqui. Também é possível colar o token na URL como ?token=...</p>}
      <ResetPasswordForm token={token} returnTo={returnTo} />
    </main>
  )
}
