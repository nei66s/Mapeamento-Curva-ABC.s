# Configurar Supabase no projeto

1. Copie `.env.local.example` para `.env.local` na raiz do projeto.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do seu projeto Supabase.
3. Instale a dependência:

```
npm install @supabase/supabase-js
```

4. Exemplo de uso no frontend (já temos `src/lib/supabaseClient.ts`):

```ts
import { supabase } from 'src/lib/supabaseClient'

const { data, error } = await supabase.from('your_table').select('*')
```

5. Se precisar de operações server-trusted, use `SUPABASE_SERVICE_ROLE_KEY` apenas em rotas/servidor.
