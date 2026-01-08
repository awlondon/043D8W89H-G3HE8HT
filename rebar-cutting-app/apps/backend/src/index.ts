import Fastify from 'fastify';

type RecognitionRequest = {
  imageBase64: string;
  metadata?: Record<string, unknown>;
};

type RecognitionResponse = {
  detections: Array<{
    id: string;
    lengthInches: number;
    confidence: number;
  }>;
};

const server = Fastify({ logger: true });

server.get('/health', async () => ({ status: 'ok' }));

server.post<{ Body: RecognitionRequest }>('/recognition/proxy', async (request, reply) => {
  const { imageBase64, metadata } = request.body;
  const endpoint = process.env.RECOGNITION_API_URL;
  const apiKey = process.env.RECOGNITION_API_KEY;

  if (!endpoint) {
    return reply.code(503).send({ error: 'Recognition API is not configured.' });
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({ imageBase64, metadata })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return reply.code(response.status).send({ error: errorBody });
  }

  const data = (await response.json()) as RecognitionResponse;
  return reply.send(data);
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

const start = async () => {
  try {
    await server.listen({ port, host });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

start();
