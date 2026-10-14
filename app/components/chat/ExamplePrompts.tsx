import React from 'react';

const EXAMPLE_PROMPTS = [
  {
    title: 'Build a web app',
    description: 'Create a responsive dashboard with working navigation and polished styling.',
    text: 'Build a responsive project dashboard using React and Tailwind. Include a sidebar, summary cards, an activity list and working responsive navigation.',
    icon: 'i-ph:browser',
  },
  {
    title: 'Create a landing page',
    description: 'Design a clear, modern page with a hero section and strong calls to action.',
    text: 'Create a modern, responsive product landing page with a strong hero section, benefits, feature cards, testimonials and accessible calls to action.',
    icon: 'i-ph:layout',
  },
  {
    title: 'Fix a bug',
    description: 'Share code or an error and get a step-by-step debugging plan.',
    text: 'Help me debug my project. First inspect the files and errors I provide, identify the most likely root cause, explain the fix, then make the smallest safe change and run the relevant tests.',
    icon: 'i-ph:bug-beetle',
  },
  {
    title: 'Build an API',
    description: 'Plan endpoints, validation, error handling and a small test suite.',
    text: 'Help me create a small REST API. Propose the routes and data model, add input validation and consistent error handling, and write tests for the main success and failure cases.',
    icon: 'i-ph:plugs-connected',
  },
  {
    title: 'Explain my code',
    description: 'Understand a file, unfamiliar logic or a project structure.',
    text: 'Explain the project structure and the most important code paths in plain language. Identify the entry point, key modules, how data flows between them and which tests cover the main behavior.',
    icon: 'i-ph:book-open-text',
  },
  {
    title: 'Make a mini game',
    description: 'Prototype an interactive game with clear rules and controls.',
    text: 'Build a small browser game using HTML, CSS and JavaScript. Give it a polished responsive interface, clear instructions, working controls, a score and a restart button.',
    icon: 'i-ph:game-controller',
  },
];

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  return (
    <section id="examples" className="relative w-full max-w-chat mx-auto px-4 sm:px-6 pb-8 mt-2">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-bolt-elements-textPrimary">Start with an idea</h2>
          <p className="text-xs text-bolt-elements-textTertiary mt-1">
            Choose a starter or describe your own project above.
          </p>
        </div>
        <span className="text-xs text-bolt-elements-textTertiary hidden sm:inline">6 quick starts</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {EXAMPLE_PROMPTS.map((examplePrompt) => (
          <button
            key={examplePrompt.title}
            type="button"
            onClick={(event) => sendMessage?.(event, examplePrompt.text)}
            aria-label={`Start: ${examplePrompt.title}`}
            className="group min-h-[104px] rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-bolt-elements-borderColorActive hover:shadow-md focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive"
            style={{ animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards' }}
          >
            <span className="flex items-center gap-2.5 mb-2">
              <span className="flex w-8 h-8 flex-shrink-0 items-center justify-center rounded-lg bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text">
                <span className={`${examplePrompt.icon} text-lg`} />
              </span>
              <span className="text-sm font-semibold text-bolt-elements-textPrimary">{examplePrompt.title}</span>
              <span className="i-ph:arrow-up-right ml-auto text-base text-bolt-elements-textTertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
            <span className="block text-xs leading-relaxed text-bolt-elements-textSecondary">
              {examplePrompt.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
