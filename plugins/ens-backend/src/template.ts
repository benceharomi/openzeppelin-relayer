import { CommandRequest } from "./command-request";
import { escape } from "html-escaper";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export function loadAndRenderCommandConfirmationTemplate(
  request: CommandRequest
): string {
  if (!request) {
    throw new Error("CommandRequest is required");
  }

  if (!request.command || request.command.trim() === "") {
    throw new Error("Command is required and cannot be empty");
  }

  if (!request.email || request.email.trim() === "") {
    throw new Error("Email is required and cannot be empty");
  }

  if (!request.verifier || request.verifier.trim() === "") {
    throw new Error("Verifier is required and cannot be empty");
  }

  const templatePath = join(
    __dirname,
    "..",
    "templates/command_confirmation.html"
  );

  if (!existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const template = readFileSync(templatePath, "utf8");

  if (!template) {
    throw new Error(`Template file is empty: ${templatePath}`);
  }

  const relayerData = JSON.stringify(request);
  const encodedRelayerData = escape(relayerData);

  return template
    .replace("{{command}}", request.command)
    .replace("{{relayer_data}}", encodedRelayerData);
}

export function loadAndRenderTransactionSuccessTemplate(
  txHash: string
): string {
  if (!txHash || txHash.trim() === "") {
    throw new Error("Transaction hash is required and cannot be empty");
  }

  const templatePath = join(
    __dirname,
    "..",
    "templates/transaction_success.html"
  );

  if (!existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const template = readFileSync(templatePath, "utf8");

  if (!template) {
    throw new Error(`Template file is empty: ${templatePath}`);
  }

  return template.replace("{{tx_hash}}", txHash);
}
