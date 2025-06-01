import { DocsLayout } from "@/components/docs-layout";

const frontmatter = {
  title: "API Reference",
  description: "Complete API reference for Deni AI SDK",
};

export default function ApiReferencePage() {
  return (
    <DocsLayout frontmatter={frontmatter}>
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1>API Reference</h1>
        
        <p className="lead">
          Complete reference for the Deni AI SDK. This page covers all available methods, 
          parameters, and response formats.
        </p>

        <h2 id="authentication">Authentication</h2>
        
        <p>All API requests require authentication using your API key:</p>
        
        <div className="not-prose">
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <pre className="text-gray-100 text-sm overflow-x-auto">
              <code>{`const client = new DeniAI({
  apiKey: 'your-api-key-here'
});`}</code>
            </pre>
          </div>
        </div>

        <h2 id="client">Client</h2>
        
        <p>The main DeniAI client class for interacting with the API.</p>

        <h3 id="constructor">Constructor</h3>
        
        <div className="not-prose">
          <div className="border rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
            <code className="text-sm">
              <span className="text-purple-600 dark:text-purple-400">new</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">DeniAI</span>
              <span className="text-gray-600 dark:text-gray-400">(</span>
              <span className="text-green-600 dark:text-green-400">options</span>
              <span className="text-gray-600 dark:text-gray-400">: </span>
              <span className="text-blue-600 dark:text-blue-400">DeniAIOptions</span>
              <span className="text-gray-600 dark:text-gray-400">)</span>
            </code>
          </div>
        </div>

        <h4>Parameters</h4>
        
        <div className="not-prose">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Parameter
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Required
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    <code>apiKey</code>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    <code>string</code>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    Yes
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    Your Deni AI API key
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    <code>baseURL</code>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    <code>string</code>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    No
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    Base URL for API requests (default: https://api.deni-ai.com/v1)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    <code>timeout</code>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    <code>number</code>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    No
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    Request timeout in milliseconds (default: 30000)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <h2 id="chat">Chat</h2>
        
        <p>Create chat completions using various AI models.</p>

        <h3 id="chat-create">chat.completions.create()</h3>
        
        <div className="not-prose">
          <div className="border rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
            <code className="text-sm">
              <span className="text-blue-600 dark:text-blue-400">client.chat.completions.create</span>
              <span className="text-gray-600 dark:text-gray-400">(</span>
              <span className="text-green-600 dark:text-green-400">params</span>
              <span className="text-gray-600 dark:text-gray-400">: </span>
              <span className="text-blue-600 dark:text-blue-400">ChatCompletionCreateParams</span>
              <span className="text-gray-600 dark:text-gray-400">): </span>
              <span className="text-purple-600 dark:text-purple-400">Promise</span>
              <span className="text-gray-600 dark:text-gray-400">&lt;</span>
              <span className="text-blue-600 dark:text-blue-400">ChatCompletion</span>
              <span className="text-gray-600 dark:text-gray-400">&gt;</span>
            </code>
          </div>
        </div>

        <p>Creates a chat completion response for the provided messages and parameters.</p>

        <h4>Example</h4>
        
        <div className="not-prose">
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <pre className="text-gray-100 text-sm overflow-x-auto">
              <code>{`const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant.'
    },
    {
      role: 'user',
      content: 'What is the capital of France?'
    }
  ],
  temperature: 0.7,
  max_tokens: 150
});

console.log(response.choices[0].message.content);`}</code>
            </pre>
          </div>
        </div>

        <h2 id="models">Models</h2>
        
        <p>List and retrieve information about available models.</p>

        <h3 id="models-list">models.list()</h3>
        
        <div className="not-prose">
          <div className="border rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
            <code className="text-sm">
              <span className="text-blue-600 dark:text-blue-400">client.models.list</span>
              <span className="text-gray-600 dark:text-gray-400">(): </span>
              <span className="text-purple-600 dark:text-purple-400">Promise</span>
              <span className="text-gray-600 dark:text-gray-400">&lt;</span>
              <span className="text-blue-600 dark:text-blue-400">ModelsListResponse</span>
              <span className="text-gray-600 dark:text-gray-400">&gt;</span>
            </code>
          </div>
        </div>

        <p>Retrieves a list of available models.</p>

        <h4>Example</h4>
        
        <div className="not-prose">
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <pre className="text-gray-100 text-sm overflow-x-auto">
              <code>{`const models = await client.models.list();
console.log(models.data.map(model => model.id));`}</code>
            </pre>
          </div>
        </div>

        <h2 id="error-handling">Error Handling</h2>
        
        <p>The SDK throws specific error types that you can catch and handle:</p>
        
        <div className="not-prose">
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <pre className="text-gray-100 text-sm overflow-x-auto">
              <code>{`import { DeniAI, APIError, AuthenticationError, RateLimitError } from '@deni-ai/sdk';

try {
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }]
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded');
  } else if (error instanceof APIError) {
    console.error('API error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}`}</code>
            </pre>
          </div>
        </div>

        <div className="not-prose mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
            Rate Limits
          </h3>
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            Be aware of API rate limits. The SDK automatically handles retries with exponential backoff, 
            but you should implement proper error handling for rate limit exceptions.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
