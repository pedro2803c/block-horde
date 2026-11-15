import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:portable` gera portable/BlockHorde.html: um único arquivo com tudo dentro
// (código, estilos e fontes), que abre com dois cliques, sem servidor e sem internet.
export default defineConfig(({ mode }) => {
  const portable = mode === 'portable';
  return {
    base: './',
    server: { port: 5174, open: false },
    preview: { port: 4174 },
    plugins: portable ? [viteSingleFile()] : [],
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 1500,
      ...(portable && { outDir: 'portable', emptyOutDir: true, assetsInlineLimit: 100000000 }),
    },
  };
});
