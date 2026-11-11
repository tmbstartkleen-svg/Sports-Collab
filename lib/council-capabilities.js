// Public, non-secret capability flags. Never infer provider credential presence.
export const councilCapabilities = Object.freeze({
  app:'Triple AI Sports Council',
  mode:'manual-read-only',
  ownerAuthenticationEnabled:false,
  providerRequestsEnabled:false,
  wageringEnabled:false,
  monthlySpendLimitUsd:0,
  backgroundPollingEnabled:false,
  automaticRetriesEnabled:false,
  pushDeliveryEnabled:false,
  seats:[
    {id:'gpt',provider:'OpenAI',connection:'not-connected',requestsEnabled:false},
    {id:'gemini',provider:'Google Gemini',connection:'scaffold-only',requestsEnabled:false},
    {id:'muse',provider:'Llama-compatible provider',connection:'not-connected',requestsEnabled:false}
  ]
});
