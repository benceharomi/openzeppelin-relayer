import { Speed } from "@openzeppelin/relayer-sdk";
import { PluginAPI, runPlugin } from "../lib/plugin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Types
interface CommandRequest {
  email: string;
  command: string;
  verifier: string;
}

interface ProverConfig {
  url: string;
  apiKey: string;
  blueprintId: string;
  circuitCppDownloadUrl: string;
  zkeyDownloadUrl: string;
}

interface ChainConfig {
  name: string;
  chainId: number;
  url: string;
  privateKey: string;
}

interface StateConfig {
  smtpUrl: string;
  prover: ProverConfig;
  rpc: ChainConfig[];
  test?: boolean;
}

interface SmtpRequest {
  to: string;
  subject: string;
  bodyPlain: string;
  bodyHtml: string;
  reference?: string;
  replyTo?: string;
  bodyAttachments?: string;
}

interface Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
}

interface ProofResponse {
  proof: Proof;
  publicOutputs: string[];
}

interface ProveRequest {
  blueprintId: string;
  proofId: string;
  zkeyDownloadUrl: string;
  circuitCppDownloadUrl: string;
  input: any;
}

// Utility functions
function decodeQuotedPrintable(body: string): string {
  if (!body || typeof body !== "string") {
    return "";
  }
  // Simple quoted-printable decoding
  return body.replace(/=([0-9A-F]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

function decodeHtmlEntities(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }
  const entities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
  };
  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

function encodeText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Command parsing
function parseCommandFromEmailBody(body: string): CommandRequest {
  if (!body || typeof body !== "string") {
    throw new Error("Email body is required and must be a string");
  }

  const cleanBody = decodeQuotedPrintable(body);
  console.info("Clean body:", cleanBody);

  // Extract relayer data from the hidden div using regex
  const re = /<div[^>]*id="[^"]*relayer-data[^"]*"[^>]*>(.*?)<\/div>/;
  const match = cleanBody.match(re);

  if (!match) {
    throw new Error("Failed to extract relayer data");
  }

  let relayerData = decodeHtmlEntities(match[1]);

  // Extract email from HTML anchor tag if present
  relayerData = relayerData.replace(/<a[^>]*>([^<]+)<\/a>/g, "$1");

  console.info("Extracted relayer data:", relayerData);

  try {
    const commandRequest: CommandRequest = JSON.parse(relayerData);
    return commandRequest;
  } catch (error) {
    throw new Error(`Failed to parse relayer data as JSON: ${error}`);
  }
}

// Template loading and rendering
function loadAndRenderTemplate(request: CommandRequest): string {
  const templatePath = join(__dirname, "templates/command_confirmation.html");

  if (!existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const template = readFileSync(templatePath, "utf8");

  if (!template) {
    throw new Error(`Template file is empty: ${templatePath}`);
  }

  const relayerData = JSON.stringify(request);
  const encodedRelayerData = encodeText(relayerData);

  return template
    .replace("{{command}}", request.command || "")
    .replace("{{relayer_data}}", encodedRelayerData);
}

function loadSuccessTemplate(txHash: string): string {
  const templatePath = join(__dirname, "templates/transaction_success.html");

  if (!existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const template = readFileSync(templatePath, "utf8");

  if (!template) {
    throw new Error(`Template file is empty: ${templatePath}`);
  }

  return template.replace("{{tx_hash}}", txHash || "");
}

// SMTP functionality
async function sendSmtpRequest(
  request: SmtpRequest,
  smtpUrl: string
): Promise<void> {
  const response = await fetch(smtpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: request.to,
      subject: request.subject,
      body_plain: request.bodyPlain,
      body_html: request.bodyHtml,
      reference: request.reference,
      reply_to: request.replyTo,
      body_attachments: request.bodyAttachments,
    }),
  });

  if (!response.ok) {
    throw new Error(`SMTP request failed: ${response.statusText}`);
  }
}

// Proof generation
async function generateProof(
  body: string,
  proverConfig: ProverConfig
): Promise<ProofResponse> {
  console.info("Generating proof");

  // For now, we'll use a mock proof generation since the actual implementation
  // requires the relayer-utils library which may not be available in TypeScript
  // In a real implementation, you would need to port the generate_email_circuit_input function

  const mockInput = {
    // Mock input data - in real implementation this would be generated from the email body
    emailBody: body,
    // Add other required fields based on the circuit requirements
  };

  const proveRequest: ProveRequest = {
    blueprintId: proverConfig.blueprintId,
    proofId: "",
    zkeyDownloadUrl: proverConfig.zkeyDownloadUrl,
    circuitCppDownloadUrl: proverConfig.circuitCppDownloadUrl,
    input: mockInput,
  };

  const response = await fetch(proverConfig.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": proverConfig.apiKey,
    },
    body: JSON.stringify(proveRequest),
  });

  if (!response.ok) {
    throw new Error(`Proof generation failed: ${response.statusText}`);
  }

  return await response.json();
}

// Proof encoding for Solidity
function encodeProofForSolidity(proofResponse: ProofResponse): {
  publicInputs: string[];
  proofBytes: string;
} {
  // Convert public outputs to U256 format
  const publicInputs = proofResponse.publicOutputs.map((output) => {
    // Convert decimal string to hex format for Solidity
    const bigInt = BigInt(output);
    return "0x" + bigInt.toString(16);
  });

  // Encode proof bytes (simplified - in real implementation this would match the Rust version)
  const pi_a = proofResponse.proof.pi_a.slice(0, 2);
  const pi_b = proofResponse.proof.pi_b
    .slice(0, 2)
    .map((row) => row.slice(0, 2));
  const pi_c = proofResponse.proof.pi_c.slice(0, 2);

  // Create a simplified proof encoding
  const proofData = {
    pi_a,
    pi_b,
    pi_c,
  };

  // Convert to hex string
  const proofBytes =
    "0x" +
    Array.from(new TextEncoder().encode(JSON.stringify(proofData)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return { publicInputs, proofBytes };
}

// Configuration loading
function loadConfig(): StateConfig {
  const configPath = join(__dirname, "config.json");

  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  try {
    const configData = readFileSync(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error}`);
  }
}

// Main plugin functions
async function commandHandler(
  api: PluginAPI,
  params: { request: CommandRequest }
): Promise<string> {
  if (!params || !params.request) {
    throw new Error("Request parameter is required");
  }

  const { request } = params;
  const config = loadConfig();

  console.info("Command request:", request);

  const htmlBody = loadAndRenderTemplate(request);

  const smtpRequest: SmtpRequest = {
    to: request.email,
    subject: `[Reply Needed] ${request.command}`,
    bodyPlain: request.command,
    bodyHtml: htmlBody,
  };

  await sendSmtpRequest(smtpRequest, config.smtpUrl);

  return "Email sent successfully";
}

async function inboxHandler(
  api: PluginAPI,
  params: { emailBody: string }
): Promise<string> {
  if (!params || !params.emailBody) {
    throw new Error("Email body parameter is required");
  }

  const { emailBody } = params;
  const config = loadConfig();

  console.info("Received inbox request");

  const commandRequest = parseCommandFromEmailBody(emailBody);
  console.info("Parsed command request:", commandRequest);

  const proof = await generateProof(emailBody, config.prover);
  console.info("Generated proof:", proof);

  const chain = config.rpc[0];
  if (!chain) {
    throw new Error("No RPC configuration found");
  }

  const relayer = api.useRelayer(chain.name);

  const { publicInputs, proofBytes } = encodeProofForSolidity(proof);
  console.info("Proof bytes:", proofBytes);
  console.info("Public inputs:", publicInputs);

  // Encode the proof for the verifier contract
  // This would typically involve calling the ProofEncoder contract's encode function
  // For now, we'll use the proof bytes directly
  const encodedProof = proofBytes;
  console.info("Encoded proof:", encodedProof);

  if (!config.test) {
    // Send the transaction through the relayer
    const result = await relayer.sendTransaction({
      to: commandRequest.verifier,
      data: encodedProof,
      value: 0, // No ETH value being sent
      gas_limit: 500000, // Adjust based on your contract's gas requirements
      speed: Speed.FAST,
    });

    const txResponse = await result.wait();
    const txHash = txResponse.hash || "unknown";

    console.info("Transaction submitted with hash:", txHash);

    // Send success email
    const successHtml = loadSuccessTemplate(txHash);
    const successRequest: SmtpRequest = {
      to: commandRequest.email,
      subject: "Your Request has been Completed",
      bodyPlain: `Your request has been successfully processed. Transaction hash: ${txHash}`,
      bodyHtml: successHtml,
    };

    await sendSmtpRequest(successRequest, config.smtpUrl);

    return `Transaction completed successfully. Hash: ${txHash}`;
  }

  return "Test mode - transaction not submitted";
}

// Plugin entry point
async function main(api: PluginAPI, params: any): Promise<string> {
  const { action, ...actionParams } = params;

  switch (action) {
    case "command":
      return await commandHandler(api, actionParams);
    case "inbox":
      return await inboxHandler(api, actionParams);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

runPlugin(main);
