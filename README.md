# JunkBox Backend

Backend OpenAPI para o JunkBox, uma rede/catalogo de musicas e albuns no estilo Letterboxd.

## Recursos

- Perfis: cadastro, login, perfil autenticado e atualizacao de bio/avatar.
- Musicas e albuns: CRUD basico, relacionamento album-musicas e busca por texto.
- Reviews: notas e textos para musicas ou albuns.
- Reconhecimento AudD: identifica uma musica tocando via upload de audio ou URL.
- Biblioteca inicial: dezenas de albuns e musicas com capas locais em `/assets/covers`.
- OpenAPI: contrato em `openapi.yaml` e Swagger UI em `/docs`.

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Servidor padrao: `http://localhost:3333`

Documentacao Swagger: `http://localhost:3333/docs`

App demo: `http://localhost:3333/app`

Flutter demo: [junkbox_flutter](C:/Users/Inteli/Documents/ponderadaS09/junkbox_flutter/README.md)

Usuario seed:

```text
email: demo@junkbox.local
senha: junkbox123
```

## AudD

Crie uma chave em AudD e configure:

```env
AUDD_API_TOKEN=...
```

Endpoint principal:

- `POST /recognition/audd`
- Autenticacao: `Bearer <token>`
- `multipart/form-data` com `audio` ou JSON com `audioUrl`.

## Observacao de persistencia

Este backend usa um arquivo JSON local para facilitar desenvolvimento e consumo pelo Flutter. Para producao, a camada `src/store.ts` pode ser trocada por PostgreSQL/Prisma sem alterar a API publica.

## Regerar biblioteca seed

```bash
npm run seed
npm run seed:covers
```

`npm run seed:covers` troca as capas locais de fallback por capas reais pesquisadas em catalogos publicos.
