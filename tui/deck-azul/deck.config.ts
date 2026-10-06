import { defineConfig } from '@unsa/slides-kit';

export default defineConfig({
  title: 'deck-azul',
  slug: 'deck-azul',
  theme: 'unsa-dark',
  visibility: 'private',
  slides: [
    {
      layout: 'hero-centered-bold',
      tag: 'Presentación',
      title: 'deck-azul',
      subtitle: 'Creado con unsarep slides y @unsa/slides-kit',
      author: 'Autor',
      date: '2026',
    },
    {
      layout: 'split-comparison-cards',
      tag: 'Comparativa',
      title: 'Arquitectura Modular',
      left: {
        title: 'Tradicional',
        badge: 'Antes',
        features: ['Diseño estático', 'Acoplamiento rígido', 'Dificultad de actualización'],
      },
      right: {
        title: 'UNSA Slides',
        badge: 'Recomendado',
        features: ['120 layouts puros', 'Tokens temáticos intercambiables', 'Despliegue ágil en la nube'],
      },
    },
    {
      layout: 'bento-4-featured-left',
      tag: 'Capacidades',
      title: 'Ecosistema de Presentaciones',
      featured: {
        stat: '120',
        label: 'Layouts Oficiales',
        description: 'Componentes estructurales diseñados para ingeniería y academia.',
      },
      cards: [
        { title: 'Familias', stat: '9 familias', status: 'optimal' },
        { title: 'Temas', stat: '3 oficiales', status: 'optimal' },
        { title: 'Embed Iframe', stat: 'Sandboxed', status: 'optimal' },
      ],
    },
    {
      layout: 'closing-qa-centered',
      title: '¿Preguntas?',
      subtitle: 'Gracias por su atención',
      contactInfo: 'contacto@unsa.edu.pe',
    },
  ],
});
