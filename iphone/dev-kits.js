/* Ivass AI — 🧰 Kits de démarrage d'Ivass Dev : projets professionnels prêts à lancer (tests, CI, README).
   Fichier partagé PC et téléphone. Développé par Messaoud BELGHAZI. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IvassKits = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const slug = (s) => String(s || 'mon-projet').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'mon-projet';
  const snake = (s) => slug(s).replace(/-/g, '_').replace(/^(\d)/, 'app_$1');
  const json = (o) => JSON.stringify(o, null, 2) + '\n';
  const signature = '\n---\nProjet créé avec le kit Ivass Dev d’Ivass AI.\n';
  const GIT_NODE = 'node_modules/\ndist/\n.next/\nout/\ncoverage/\n.env\n.env.*\n!.env.example\n*.log\n.DS_Store\n';
  const GIT_PY = '__pycache__/\n*.pyc\n.venv/\n.env\n.pytest_cache/\n*.db\n';
  const ciNode = (build) => `name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test${build ? '\n      - run: npm run build' : ''}
`;

  const KITS = [
    { id: 'next', icone: '🌐', nom: 'Site web Next.js + Tailwind', niveau: 'n1', stack: 'Next.js · React · TypeScript · Tailwind CSS · Vitest',
      desc: 'Site ou application web moderne : pages, composants, thème sombre, tests et déploiement Vercel.',
      lancer: ['npm install', 'npm run dev', 'npm test'],
      fichiers: (nom) => [
        { path: 'package.json', content: json({ name: slug(nom), version: '0.1.0', private: true, type: 'module',
          scripts: { dev: 'next dev', build: 'next build', start: 'next start', test: 'vitest run' },
          dependencies: { next: '^16.0.0', react: '^19.0.0', 'react-dom': '^19.0.0' },
          devDependencies: { '@tailwindcss/postcss': '^4.0.0', tailwindcss: '^4.0.0', typescript: '^5.6.0', '@types/node': '^22.0.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0', vitest: '^5.0.0' } }) },
        { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: false, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'preserve', incremental: true, plugins: [{ name: 'next' }], paths: { '@/*': ['./*'] } }, include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], exclude: ['node_modules'] }) },
        { path: 'next.config.mjs', content: '/** @type {import(\'next\').NextConfig} */\nconst nextConfig = { reactStrictMode: true };\nexport default nextConfig;\n' },
        { path: 'postcss.config.mjs', content: 'export default { plugins: { \'@tailwindcss/postcss\': {} } };\n' },
        { path: 'app/globals.css', content: '@import "tailwindcss";\n\n:root { color-scheme: light dark; }\nbody { @apply bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100; }\n' },
        { path: 'app/layout.tsx', content: `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: ${JSON.stringify(nom || 'Mon projet')},
  description: 'Créé avec le kit Next.js d’Ivass Dev',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
` },
        { path: 'app/page.tsx', content: `import { formatEuros, totalParJour } from '@/lib/calculs';

const exemples = [
  { jour: '2026-11-02', montant: 85 },
  { jour: '2026-11-02', montant: 120 },
  { jour: '2026-11-03', montant: 95 },
];

export default function Accueil() {
  const totaux = totalParJour(exemples);
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold">${String(nom || 'Mon projet').replace(/[{}<>`$\\]/g, '')}</h1>
      <p className="mt-2 text-zinc-500">Votre application Next.js est prête. Modifiez app/page.tsx pour commencer.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {Object.entries(totaux).map(([jour, total]) => (
          <li key={jour} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="text-sm text-zinc-500">{jour}</div>
            <div className="text-2xl font-semibold">{formatEuros(total)}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
` },
        { path: 'lib/calculs.ts', content: `export type Ligne = { jour: string; montant: number };

/** Additionne les montants par jour. */
export function totalParJour(lignes: Ligne[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of lignes) out[l.jour] = (out[l.jour] ?? 0) + l.montant;
  return out;
}

export function formatEuros(n: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n);
}
` },
        { path: 'lib/calculs.test.ts', content: `import { describe, expect, it } from 'vitest';
import { totalParJour } from './calculs';

describe('totalParJour', () => {
  it('additionne les montants du même jour', () => {
    expect(totalParJour([{ jour: 'a', montant: 1 }, { jour: 'a', montant: 2 }, { jour: 'b', montant: 5 }])).toEqual({ a: 3, b: 5 });
  });
  it('renvoie un objet vide sans lignes', () => {
    expect(totalParJour([])).toEqual({});
  });
});
` },
        { path: '.gitignore', content: GIT_NODE + 'next-env.d.ts\n*.tsbuildinfo\n' },
        { path: '.github/workflows/ci.yml', content: ciNode(true) },
        { path: 'README.md', content: `# ${nom || 'Mon projet'}

Application web Next.js (App Router), React, TypeScript et Tailwind CSS.

## Démarrer
\`\`\`bash
npm install
npm run dev      # http://localhost:3000
npm test         # tests Vitest
npm run build    # version de production
\`\`\`

## Structure
- \`app/\` : pages et mise en page (App Router)
- \`lib/\` : logique métier testée (\`*.test.ts\`)
- \`.github/workflows/ci.yml\` : tests et build à chaque push

## Déployer
Importez le dépôt sur Vercel (vercel.com/new) : chaque push sur \`main\` est mis en ligne.

## Documentation
- Next.js : https://nextjs.org/docs
- Tailwind CSS : https://tailwindcss.com/docs
${signature}` },
      ] },

    { id: 'nest', icone: '🗄', nom: 'API NestJS + PostgreSQL + Docker', niveau: 'n2', stack: 'NestJS · TypeScript · PostgreSQL · Docker Compose',
      desc: 'API REST professionnelle : modules, validation, base PostgreSQL, Docker et tests.',
      lancer: ['cp .env.example .env  (choisissez un mot de passe)', 'docker compose up -d db', 'npm install', 'npm run dev', 'npm test'],
      fichiers: (nom) => [
        { path: 'package.json', content: json({ name: slug(nom), version: '0.1.0', private: true,
          scripts: { build: 'tsc -p tsconfig.json', dev: 'tsc -p tsconfig.json && node dist/main.js', start: 'node dist/main.js', test: 'tsc -p tsconfig.json && node --test "dist/**/*.spec.js"' },
          dependencies: { '@nestjs/common': '^12.0.0', '@nestjs/core': '^12.0.0', '@nestjs/platform-express': '^12.0.0', pg: '^8.13.0', 'reflect-metadata': '^0.2.2', rxjs: '^7.8.1' },
          devDependencies: { typescript: '^5.6.0', '@types/node': '^22.0.0', '@types/pg': '^8.11.0', '@types/express': '^5.0.0' } }) },
        { path: 'tsconfig.json', content: json({ compilerOptions: { module: 'commonjs', target: 'ES2022', outDir: 'dist', rootDir: 'src', strict: true, esModuleInterop: true, experimentalDecorators: true, emitDecoratorMetadata: true, skipLibCheck: true, sourceMap: true }, include: ['src'] }) },
        { path: 'src/main.ts', content: `import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try { process.loadEnvFile(); } catch { /* pas de fichier .env : variables du système */ }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(\`API prête sur http://localhost:\${port}/v1/sante\`);
}
bootstrap();
` },
        { path: 'src/app.module.ts', content: `import { Module } from '@nestjs/common';
import { SanteController } from './sante.controller';
import { InterventionsModule } from './interventions/interventions.module';

@Module({ imports: [InterventionsModule], controllers: [SanteController] })
export class AppModule {}
` },
        { path: 'src/sante.controller.ts', content: `import { Controller, Get } from '@nestjs/common';

@Controller('sante')
export class SanteController {
  @Get()
  sante() {
    return { ok: true, heure: new Date().toISOString() };
  }
}
` },
        { path: 'src/db.ts', content: `import { Pool } from 'pg';

/** Connexion PostgreSQL : variables PGHOST, PGUSER, PGPASSWORD, PGDATABASE (fichier .env, voir .env.example).
    Aucun mot de passe n'est écrit dans le code. */
export const pool = new Pool();
` },
        { path: 'src/interventions/validation.ts', content: `export type NouvelleIntervention = { client: string; type: string; montant: number; date: string };

/** Valide le corps reçu ; renvoie la liste des erreurs (vide si tout est bon). */
export function valider(b: any): string[] {
  const e: string[] = [];
  if (!b || typeof b !== 'object') return ['corps manquant'];
  if (typeof b.client !== 'string' || !b.client.trim()) e.push('client obligatoire');
  if (typeof b.type !== 'string' || !b.type.trim()) e.push('type obligatoire');
  if (typeof b.montant !== 'number' || !Number.isFinite(b.montant) || b.montant < 0) e.push('montant positif obligatoire');
  if (typeof b.date !== 'string' || Number.isNaN(Date.parse(b.date))) e.push('date ISO obligatoire');
  return e;
}
` },
        { path: 'src/interventions/validation.spec.ts', content: `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valider } from './validation';

test('une intervention complète est valide', () => {
  assert.deepEqual(valider({ client: 'Dupont', type: 'Raccordement', montant: 85, date: '2026-11-02' }), []);
});
test('les champs manquants sont signalés', () => {
  assert.equal(valider({ montant: -1 }).length, 4);
});
` },
        { path: 'src/interventions/interventions.service.ts', content: `import { Injectable } from '@nestjs/common';
import { pool } from '../db';
import { NouvelleIntervention } from './validation';

@Injectable()
export class InterventionsService {
  async lister(limite = 50) {
    const r = await pool.query('SELECT id, client, type, montant, date FROM interventions ORDER BY date DESC LIMIT $1', [limite]);
    return r.rows;
  }
  async creer(i: NouvelleIntervention) {
    const r = await pool.query('INSERT INTO interventions (client, type, montant, date) VALUES ($1, $2, $3, $4) RETURNING *', [i.client, i.type, i.montant, i.date]);
    return r.rows[0];
  }
}
` },
        { path: 'src/interventions/interventions.controller.ts', content: `import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InterventionsService } from './interventions.service';
import { valider } from './validation';

@Controller('interventions')
export class InterventionsController {
  constructor(private readonly service: InterventionsService) {}

  @Get()
  lister(@Query('limite') limite?: string) {
    return this.service.lister(Math.min(Math.max(Number(limite) || 50, 1), 200));
  }

  @Post()
  creer(@Body() corps: any) {
    const erreurs = valider(corps);
    if (erreurs.length) throw new BadRequestException(erreurs);
    return this.service.creer(corps);
  }
}
` },
        { path: 'src/interventions/interventions.module.ts', content: `import { Module } from '@nestjs/common';
import { InterventionsController } from './interventions.controller';
import { InterventionsService } from './interventions.service';

@Module({ controllers: [InterventionsController], providers: [InterventionsService] })
export class InterventionsModule {}
` },
        { path: 'db/init.sql', content: 'CREATE TABLE IF NOT EXISTS interventions (\n  id SERIAL PRIMARY KEY,\n  client TEXT NOT NULL,\n  type TEXT NOT NULL,\n  montant NUMERIC(10, 2) NOT NULL CHECK (montant >= 0),\n  date DATE NOT NULL,\n  cree_le TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nCREATE INDEX IF NOT EXISTS interventions_date ON interventions (date DESC);\n' },
        { path: 'docker-compose.yml', content: `services:
  db:
    image: postgres:17
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?Ajoutez POSTGRES_PASSWORD dans le fichier .env}
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - donnees:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
  api:
    build: .
    environment:
      PGHOST: db
      PGUSER: app
      PGPASSWORD: \${POSTGRES_PASSWORD}
      PGDATABASE: app
    ports:
      - "3000:3000"
    depends_on:
      - db
volumes:
  donnees:
` },
        { path: 'Dockerfile', content: 'FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY tsconfig.json ./\nCOPY src ./src\nRUN npm run build\n\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY --from=build /app/dist ./dist\nUSER node\nEXPOSE 3000\nCMD ["node", "dist/main.js"]\n' },
        { path: '.env.example', content: '# Copiez ce fichier en .env et choisissez un mot de passe (le même aux deux endroits).\n# Le fichier .env n’est jamais publié (.gitignore).\nPOSTGRES_PASSWORD=\nPGHOST=localhost\nPGUSER=app\nPGPASSWORD=\nPGDATABASE=app\nPORT=3000\n' },
        { path: '.gitignore', content: GIT_NODE },
        { path: '.github/workflows/ci.yml', content: ciNode(false) },
        { path: 'README.md', content: `# ${nom || 'Mon API'}

API REST NestJS + PostgreSQL, prête pour Docker.

## Démarrer
\`\`\`bash
cp .env.example .env     # puis choisissez un mot de passe dans .env
docker compose up -d db   # base PostgreSQL (crée la table grâce à db/init.sql)
npm install
npm run dev               # http://localhost:3000/v1/sante
npm test                  # tests (node:test)
docker compose up --build # API + base dans Docker
\`\`\`

## Routes
| Méthode | Chemin | Rôle |
|---|---|---|
| GET | /v1/sante | État de l'API |
| GET | /v1/interventions?limite=50 | Liste des interventions |
| POST | /v1/interventions | Crée une intervention (client, type, montant, date) |

## Sécurité
Requêtes SQL paramétrées, validation des entrées, conteneur sans droits root. Avant la production : authentification, limitation de débit, HTTPS.

## Documentation
- NestJS : https://docs.nestjs.com/
- PostgreSQL : https://www.postgresql.org/docs/
${signature}` },
      ] },

    { id: 'fastapi', icone: '🐍', nom: 'API Python FastAPI', niveau: 'n2', stack: 'Python · FastAPI · SQLAlchemy · PostgreSQL / SQLite · pytest',
      desc: 'API Python rapide et typée, documentation Swagger automatique, base SQL et tests.',
      lancer: ['python -m venv .venv', 'pip install -r requirements.txt', 'uvicorn app.main:app --reload', 'pytest'],
      fichiers: (nom) => [
        { path: 'requirements.txt', content: 'fastapi>=0.115\nuvicorn[standard]>=0.30\nsqlalchemy>=2.0\npsycopg[binary]>=3.2\npytest>=8\nhttpx>=0.27\n' },
        { path: 'app/__init__.py', content: '' },
        { path: 'app/db.py', content: `import os
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def adresse():
    \"\"\"SQLite par défaut ; PostgreSQL avec les variables PGHOST, PGUSER, PGPASSWORD, PGDATABASE (aucun mot de passe dans le code).\"\"\"
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    if os.getenv("PGHOST"):
        return URL.create("postgresql+psycopg", username=os.getenv("PGUSER", "app"), password=os.getenv("PGPASSWORD"),
                          host=os.getenv("PGHOST"), port=int(os.getenv("PGPORT", "5432")), database=os.getenv("PGDATABASE", "app"))
    return "sqlite:///./app.db"


ADRESSE = adresse()
engine = create_engine(ADRESSE, connect_args={"check_same_thread": False} if str(ADRESSE).startswith("sqlite") else {})
Session = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def session():
    s = Session()
    try:
        yield s
    finally:
        s.close()
` },
        { path: 'app/models.py', content: `from datetime import date
from sqlalchemy import Date, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


class Intervention(Base):
    __tablename__ = "interventions"
    id: Mapped[int] = mapped_column(primary_key=True)
    client: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(100))
    montant: Mapped[float] = mapped_column(Numeric(10, 2))
    date: Mapped[date] = mapped_column(Date, index=True)
` },
        { path: 'app/main.py', content: `from datetime import date
from fastapi import Depends, FastAPI, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from .db import Base, engine, session
from .models import Intervention

app = FastAPI(title=${JSON.stringify(nom || 'Mon API')}, version="0.1.0")
Base.metadata.create_all(engine)


class InterventionIn(BaseModel):
    client: str = Field(min_length=1, max_length=200)
    type: str = Field(min_length=1, max_length=100)
    montant: float = Field(ge=0)
    date: date


class InterventionOut(InterventionIn):
    id: int


@app.get("/v1/sante")
def sante():
    return {"ok": True}


@app.get("/v1/interventions", response_model=list[InterventionOut])
def lister(limite: int = Query(50, ge=1, le=200), s: Session = Depends(session)):
    lignes = s.scalars(select(Intervention).order_by(Intervention.date.desc()).limit(limite)).all()
    return [InterventionOut(id=x.id, client=x.client, type=x.type, montant=float(x.montant), date=x.date) for x in lignes]


@app.post("/v1/interventions", response_model=InterventionOut, status_code=201)
def creer(corps: InterventionIn, s: Session = Depends(session)):
    x = Intervention(**corps.model_dump())
    s.add(x)
    s.commit()
    s.refresh(x)
    return InterventionOut(id=x.id, client=x.client, type=x.type, montant=float(x.montant), date=x.date)
` },
        { path: 'tests/__init__.py', content: '' },
        { path: 'tests/test_api.py', content: `import os
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)


def test_sante():
    assert client.get("/v1/sante").json() == {"ok": True}


def test_creer_puis_lister():
    r = client.post("/v1/interventions", json={"client": "Dupont", "type": "Raccordement", "montant": 85, "date": "2026-11-02"})
    assert r.status_code == 201
    assert any(x["client"] == "Dupont" for x in client.get("/v1/interventions").json())


def test_validation():
    assert client.post("/v1/interventions", json={"client": "", "type": "x", "montant": -1, "date": "pas une date"}).status_code == 422
` },
        { path: 'Dockerfile', content: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY app ./app\nRUN useradd -m appuser\nUSER appuser\nEXPOSE 8000\nCMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]\n' },
        { path: 'docker-compose.yml', content: 'services:\n  db:\n    image: postgres:17\n    environment:\n      POSTGRES_USER: app\n      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Ajoutez POSTGRES_PASSWORD dans le fichier .env}\n      POSTGRES_DB: app\n    volumes:\n      - donnees:/var/lib/postgresql/data\n  api:\n    build: .\n    environment:\n      PGHOST: db\n      PGUSER: app\n      PGPASSWORD: ${POSTGRES_PASSWORD}\n      PGDATABASE: app\n    ports:\n      - "8000:8000"\n    depends_on:\n      - db\nvolumes:\n  donnees:\n' },
        { path: '.env.example', content: '# Copiez ce fichier en .env et choisissez un mot de passe : docker compose le lit automatiquement.\nPOSTGRES_PASSWORD=\n' },
        { path: '.gitignore', content: GIT_PY },
        { path: '.github/workflows/ci.yml', content: 'name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with:\n          python-version: "3.12"\n          cache: pip\n      - run: pip install -r requirements.txt\n      - run: pytest -q\n' },
        { path: 'README.md', content: `# ${nom || 'Mon API'}

API Python FastAPI + SQLAlchemy. SQLite par défaut, PostgreSQL avec Docker.

## Démarrer
\`\`\`bash
python -m venv .venv
.venv\\Scripts\\activate        # Windows (macOS/Linux : source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://127.0.0.1:8000/docs
pytest
cp .env.example .env           # puis choisissez un mot de passe
docker compose up --build      # API + PostgreSQL
\`\`\`

La documentation interactive (Swagger) est sur /docs.

## Documentation
- FastAPI : https://fastapi.tiangolo.com/
- SQLAlchemy : https://docs.sqlalchemy.org/
${signature}` },
      ] },

    { id: 'electron', icone: '🖥', nom: 'Application de bureau Electron', niveau: 'n3', stack: 'Electron · JavaScript · contextBridge · electron-builder',
      desc: 'Logiciel Windows, macOS et Linux sécurisé dès le départ, avec installateur.',
      lancer: ['npm install', 'npm start', 'npm test', 'npm run dist'],
      fichiers: (nom) => [
        { path: 'package.json', content: json({ name: slug(nom), productName: nom || 'Mon logiciel', version: '0.1.0', private: true, main: 'src/main.js',
          scripts: { start: 'electron .', test: 'node --test "test/*.test.js"', dist: 'electron-builder' },
          devDependencies: { electron: '^45.0.0', 'electron-builder': '^26.0.0' },
          build: { appId: 'com.ivass.' + slug(nom).replace(/-/g, ''), files: ['src/**/*'], win: { target: 'nsis' }, mac: { target: 'dmg' }, linux: { target: 'AppImage' } } }) },
        { path: 'src/main.js', content: `'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { resumer } = require('./logique');

function creerFenetre() {
  const w = new BrowserWindow({
    width: 1000, height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // l'écran n'a pas accès à Node.js
      nodeIntegration: false,
      sandbox: true,
    },
  });
  w.loadFile(path.join(__dirname, 'index.html'));
}

// Une seule fonction exposée à l'écran, avec des entrées vérifiées
ipcMain.handle('resumer', (_e, texte) => resumer(String(texte || '').slice(0, 100000)));

app.whenReady().then(() => {
  creerFenetre();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) creerFenetre(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
` },
        { path: 'src/preload.js', content: `'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// Liste blanche : l'écran ne peut appeler que ces fonctions
contextBridge.exposeInMainWorld('api', {
  resumer: (texte) => ipcRenderer.invoke('resumer', texte),
});
` },
        { path: 'src/logique.js', content: `'use strict';
/** Statistiques simples d'un texte (logique pure, testée dans test/). */
function resumer(texte) {
  const mots = texte.trim() ? texte.trim().split(/\\s+/).length : 0;
  const lignes = texte ? texte.split(/\\n/).length : 0;
  return { caracteres: texte.length, mots, lignes };
}
module.exports = { resumer };
` },
        { path: 'src/index.html', content: `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">
  <title>${String(nom || 'Mon logiciel').replace(/[<>&"]/g, '')}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #0f1115; color: #e8eaf0; }
    textarea { width: 100%; height: 240px; background: #171a21; color: inherit; border: 1px solid #2a2f3a; border-radius: 10px; padding: 12px; }
    button { margin-top: 12px; padding: 10px 18px; border-radius: 10px; border: 0; background: #e8eaf0; color: #0f1115; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <h1>${String(nom || 'Mon logiciel').replace(/[<>&"]/g, '')}</h1>
  <textarea id="texte" placeholder="Collez un texte…"></textarea>
  <button id="go">Analyser</button>
  <p id="resultat"></p>
  <script src="renderer.js"></script>
</body>
</html>
` },
        { path: 'src/renderer.js', content: `document.getElementById('go').addEventListener('click', async () => {
  const r = await window.api.resumer(document.getElementById('texte').value);
  document.getElementById('resultat').textContent = \`\${r.mots} mots · \${r.lignes} lignes · \${r.caracteres} caractères\`;
});
` },
        { path: 'test/logique.test.js', content: `'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resumer } = require('../src/logique');

test('compte mots, lignes et caractères', () => {
  assert.deepEqual(resumer('bonjour le monde\\nsalut'), { caracteres: 22, mots: 4, lignes: 2 });
});
test('texte vide', () => {
  assert.deepEqual(resumer(''), { caracteres: 0, mots: 0, lignes: 0 });
});
` },
        { path: '.gitignore', content: GIT_NODE },
        { path: '.github/workflows/ci.yml', content: ciNode(false) },
        { path: 'README.md', content: `# ${nom || 'Mon logiciel'}

Application de bureau Electron, sécurisée dès le départ : isolation du contexte, bac à sable, preload en liste blanche, politique de sécurité du contenu.

## Démarrer
\`\`\`bash
npm install
npm start        # lance l'application
npm test         # tests de la logique
npm run dist     # installateur (dossier dist/)
\`\`\`

## Règles de sécurité gardées
- \`contextIsolation: true\`, \`nodeIntegration: false\`, \`sandbox: true\`
- l'écran n'appelle que les fonctions déclarées dans \`preload.js\`
- chaque entrée reçue par \`ipcMain.handle\` est vérifiée

## Documentation
- Electron : https://www.electronjs.org/docs/latest
- Sécurité Electron : https://www.electronjs.org/docs/latest/tutorial/security
${signature}` },
      ] },

    { id: 'flutter', icone: '📱', nom: 'Application mobile Flutter', niveau: 'n3', stack: 'Flutter · Dart · Material 3 · Android · iPhone',
      desc: 'Une seule base de code pour Android et iPhone, interface Material 3 et tests de widgets.',
      lancer: ['flutter create .', 'flutter pub get', 'flutter run', 'flutter test'],
      fichiers: (nom) => [
        { path: 'pubspec.yaml', content: `name: ${snake(nom)}
description: ${JSON.stringify(nom || 'Mon application')}
publish_to: "none"
version: 0.1.0+1

environment:
  sdk: ">=3.5.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0

flutter:
  uses-material-design: true
` },
        { path: 'analysis_options.yaml', content: 'include: package:flutter_lints/flutter.yaml\n' },
        { path: 'lib/main.dart', content: `import 'package:flutter/material.dart';

void main() => runApp(const MonApp());

class MonApp extends StatelessWidget {
  const MonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: ${JSON.stringify(nom || 'Mon application')},
      theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
      darkTheme: ThemeData(colorSchemeSeed: Colors.indigo, brightness: Brightness.dark, useMaterial3: true),
      home: const ListePage(),
    );
  }
}

class ListePage extends StatefulWidget {
  const ListePage({super.key});

  @override
  State<ListePage> createState() => _ListePageState();
}

class _ListePageState extends State<ListePage> {
  final _elements = <String>[];
  final _champ = TextEditingController();

  void _ajouter() {
    final t = _champ.text.trim();
    if (t.isEmpty) return;
    setState(() => _elements.add(t));
    _champ.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(${JSON.stringify(nom || 'Mon application')})),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Expanded(child: TextField(controller: _champ, decoration: const InputDecoration(hintText: 'Nouvel élément'), onSubmitted: (_) => _ajouter())),
            const SizedBox(width: 8),
            FilledButton(key: const Key('ajouter'), onPressed: _ajouter, child: const Text('Ajouter')),
          ]),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: _elements.length,
            itemBuilder: (_, i) => ListTile(leading: const Icon(Icons.check_circle_outline), title: Text(_elements[i])),
          ),
        ),
      ]),
    );
  }
}
` },
        { path: 'test/widget_test.dart', content: `import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:${snake(nom)}/main.dart';

void main() {
  testWidgets('ajoute un élément à la liste', (tester) async {
    await tester.pumpWidget(const MonApp());
    await tester.enterText(find.byType(TextField), 'Raccordement PLP');
    await tester.tap(find.byKey(const Key('ajouter')));
    await tester.pump();
    expect(find.text('Raccordement PLP'), findsOneWidget);
  });
}
` },
        { path: '.gitignore', content: '.dart_tool/\n.packages\nbuild/\n.flutter-plugins\n.flutter-plugins-dependencies\n*.iml\n.idea/\n' },
        { path: '.github/workflows/ci.yml', content: 'name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: subosito/flutter-action@v2\n        with:\n          channel: stable\n      - run: flutter pub get\n      - run: flutter analyze\n      - run: flutter test\n' },
        { path: 'README.md', content: `# ${nom || 'Mon application'}

Application Flutter (Material 3, thème clair et sombre) pour Android et iPhone.

## Démarrer
\`\`\`bash
flutter create .   # génère les dossiers android/ et ios/ (une seule fois)
flutter pub get
flutter run        # sur un téléphone branché ou un émulateur
flutter test
\`\`\`

Installez d'abord Flutter : https://docs.flutter.dev/get-started/install

## Documentation
- Flutter : https://docs.flutter.dev/
- Material 3 : https://m3.material.io/
${signature}` },
      ] },

    { id: 'expo', icone: '⚛️', nom: 'Application mobile React Native (Expo)', niveau: 'n3', stack: 'React Native · Expo · TypeScript',
      desc: 'Application Android et iPhone en React, testée sur votre téléphone avec Expo Go.',
      lancer: ['npm install', 'npx expo install react react-native expo-status-bar @types/react', 'npx expo start'],
      fichiers: (nom) => [
        { path: 'package.json', content: json({ name: slug(nom), version: '0.1.0', private: true, main: 'index.ts',
          scripts: { start: 'expo start', android: 'expo start --android', ios: 'expo start --ios', test: 'node --test "test/*.test.js"' },
          dependencies: { expo: '^58.0.0' },
          devDependencies: { typescript: '^5.6.0' } }) },
        { path: 'app.json', content: json({ expo: { name: nom || 'Mon application', slug: slug(nom), version: '0.1.0', orientation: 'portrait', userInterfaceStyle: 'automatic' } }) },
        { path: 'tsconfig.json', content: json({ extends: 'expo/tsconfig.base', compilerOptions: { strict: true } }) },
        { path: 'index.ts', content: "import { registerRootComponent } from 'expo';\nimport App from './App';\n\nregisterRootComponent(App);\n" },
        { path: 'App.tsx', content: `import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ajouter } from './logique';

export default function App() {
  const [elements, setElements] = useState<string[]>([]);
  const [texte, setTexte] = useState('');
  return (
    <SafeAreaView style={styles.page}>
      <Text style={styles.titre}>${String(nom || 'Mon application').replace(/[{}<>`$\\]/g, '')}</Text>
      <View style={styles.ligne}>
        <TextInput style={styles.champ} value={texte} onChangeText={setTexte} placeholder="Nouvel élément" />
        <Pressable style={styles.bouton} onPress={() => { setElements(ajouter(elements, texte)); setTexte(''); }}>
          <Text style={styles.boutonTexte}>Ajouter</Text>
        </Pressable>
      </View>
      <FlatList data={elements} keyExtractor={(x, i) => x + i} renderItem={({ item }) => <Text style={styles.element}>✓ {item}</Text>} />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20 },
  titre: { fontSize: 26, fontWeight: '600', marginVertical: 16 },
  ligne: { flexDirection: 'row', gap: 8 },
  champ: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 12 },
  bouton: { backgroundColor: '#3f51b5', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  boutonTexte: { color: 'white', fontWeight: '600' },
  element: { paddingVertical: 10, fontSize: 16 },
});
` },
        { path: 'logique.js', content: "/** Ajoute un élément non vide à la liste (sans modifier l'originale). */\nfunction ajouter(liste, texte) {\n  const t = String(texte || '').trim();\n  return t ? [...liste, t] : liste;\n}\nmodule.exports = { ajouter };\n" },
        { path: 'test/logique.test.js', content: "const { test } = require('node:test');\nconst assert = require('node:assert/strict');\nconst { ajouter } = require('../logique');\n\ntest('ajoute un élément', () => assert.deepEqual(ajouter(['a'], ' b '), ['a', 'b']));\ntest('ignore un texte vide', () => assert.deepEqual(ajouter(['a'], '  '), ['a']));\n" },
        { path: '.gitignore', content: GIT_NODE + '.expo/\nios/\nandroid/\n' },
        { path: '.github/workflows/ci.yml', content: ciNode(false).replace('npm ci', 'npm install') },
        { path: 'README.md', content: `# ${nom || 'Mon application'}

Application React Native avec Expo et TypeScript, pour Android et iPhone.

## Démarrer
\`\`\`bash
npm install
npx expo install react react-native expo-status-bar @types/react   # versions adaptées à Expo
npx expo start           # scannez le QR code avec l'application Expo Go
npm test
\`\`\`

## Documentation
- Expo : https://docs.expo.dev/
- React Native : https://reactnative.dev/docs/getting-started
${signature}` },
      ] },

    { id: 'rag', icone: '🤖', nom: 'Assistant IA RAG avec Ollama', niveau: 'n5', stack: 'Python · Ollama · embeddings · citations',
      desc: 'Un assistant qui répond à partir de vos documents, hors ligne, avec ses sources.',
      lancer: ['ollama pull nomic-embed-text', 'ollama pull llama3.2', 'python rag.py indexer docs', 'python rag.py demander "Votre question"', 'python -m unittest'],
      fichiers: (nom) => [
        { path: 'rag.py', content: `"""Assistant RAG local : indexe vos documents texte et répond avec les sources (Ollama).
Usage :
  python rag.py indexer docs
  python rag.py demander "Comment raccorder un PLP ?"
"""
import json
import math
import os
import sys
import urllib.request

OLLAMA = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODELE_EMB = os.getenv("MODELE_EMBEDDINGS", "nomic-embed-text")
MODELE_IA = os.getenv("MODELE_IA", "llama3.2")
INDEX = "index.json"


def appel(chemin, corps):
    req = urllib.request.Request(OLLAMA + chemin, data=json.dumps(corps).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read())


def decouper(texte, taille=800, chevauchement=150):
    """Découpe un texte en morceaux qui se chevauchent (le contexte n'est pas coupé net)."""
    morceaux, i = [], 0
    while i < len(texte):
        morceaux.append(texte[i:i + taille])
        i += taille - chevauchement
    return [m for m in morceaux if m.strip()]


def cosinus(a, b):
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)


def vecteurs(textes):
    return appel("/api/embed", {"model": MODELE_EMB, "input": textes})["embeddings"]


def indexer(dossier):
    entrees = []
    for racine, _, fichiers in os.walk(dossier):
        for f in fichiers:
            if not f.lower().endswith((".txt", ".md")):
                continue
            chemin = os.path.join(racine, f)
            with open(chemin, encoding="utf-8", errors="ignore") as h:
                morceaux = decouper(h.read())
            for m, v in zip(morceaux, vecteurs(morceaux) if morceaux else []):
                entrees.append({"source": chemin, "texte": m, "v": v})
    with open(INDEX, "w", encoding="utf-8") as h:
        json.dump(entrees, h)
    print(f"{len(entrees)} passages indexés.")


def chercher(question, k=4):
    with open(INDEX, encoding="utf-8") as h:
        entrees = json.load(h)
    q = vecteurs([question])[0]
    return sorted(entrees, key=lambda e: cosinus(q, e["v"]), reverse=True)[:k]


def demander(question):
    passages = chercher(question)
    contexte = "\\n\\n".join(f"[{i + 1}] ({p['source']}) {p['texte']}" for i, p in enumerate(passages))
    consigne = ("Réponds uniquement à partir des passages ci-dessous et cite-les avec [numéro]. "
                "Si la réponse n'y est pas, dis que tu ne sais pas.\\n\\n" + contexte + "\\n\\nQuestion : " + question)
    r = appel("/api/chat", {"model": MODELE_IA, "stream": False, "messages": [{"role": "user", "content": consigne}]})
    print(r["message"]["content"])
    print("\\nSources :", ", ".join(sorted({p["source"] for p in passages})))


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ("indexer", "demander"):
        print(__doc__)
        sys.exit(1)
    indexer(sys.argv[2]) if sys.argv[1] == "indexer" else demander(" ".join(sys.argv[2:]))
` },
        { path: 'test_rag.py', content: `import unittest
from rag import cosinus, decouper


class TestRag(unittest.TestCase):
    def test_decouper_chevauche(self):
        m = decouper("a" * 2000, taille=800, chevauchement=150)
        self.assertEqual(len(m), 4)  # pas de 650 : 0, 650, 1300, 1950
        self.assertEqual(len(m[0]), 800)

    def test_cosinus(self):
        self.assertAlmostEqual(cosinus([1, 0], [1, 0]), 1.0)
        self.assertAlmostEqual(cosinus([1, 0], [0, 1]), 0.0)


if __name__ == "__main__":
    unittest.main()
` },
        { path: 'docs/exemple.md', content: '# Exemple\n\nPlacez ici vos fiches (.md ou .txt). Exemple : un raccordement PLP commence par le repérage du boîtier, puis le tirage du câble, la soudure par fusion et la mesure au réflectomètre.\n' },
        { path: 'evaluation.md', content: '# Jeu d’évaluation\n\nNotez ici 20 à 50 questions avec la réponse attendue. Relancez-les après chaque changement de modèle ou de découpage, et comptez les bonnes réponses.\n\n| # | Question | Réponse attendue | Résultat |\n|---|---|---|---|\n| 1 | Par quoi commence un raccordement PLP ? | Le repérage du boîtier | |\n' },
        { path: '.gitignore', content: GIT_PY + 'index.json\n' },
        { path: '.github/workflows/ci.yml', content: 'name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with:\n          python-version: "3.12"\n      - run: python -m unittest -v\n' },
        { path: 'README.md', content: `# ${nom || 'Mon assistant RAG'}

Assistant qui répond à partir de vos documents, entièrement sur votre PC avec Ollama, en citant ses sources.

## Démarrer
\`\`\`bash
ollama pull nomic-embed-text
ollama pull llama3.2
python rag.py indexer docs
python rag.py demander "Par quoi commence un raccordement PLP ?"
python -m unittest
\`\`\`

## Comment ça marche
1. Les documents sont découpés en passages qui se chevauchent.
2. Chaque passage devient un vecteur (embedding).
3. La question est comparée aux passages (similarité cosinus) ; les 4 plus proches sont envoyés à l'IA.
4. L'IA répond uniquement à partir de ces passages et les cite.

Pour aller plus loin : base vectorielle (pgvector, Qdrant), recherche hybride, reclassement, et le jeu d'évaluation de \`evaluation.md\`.

## Documentation
- Ollama : https://docs.ollama.com/
- LlamaIndex : https://docs.llamaindex.ai/
${signature}` },
      ] },
  ];

  function fichiers(id, nom) {
    const k = KITS.find((x) => x.id === id);
    if (!k) throw new Error('Kit inconnu.');
    return k.fichiers(String(nom || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 80) || k.nom);
  }
  return { KITS, fichiers, slug };
});
