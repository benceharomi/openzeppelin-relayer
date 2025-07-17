import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { CommandRequest } from "./command-request";
import { escape } from "html-escaper";

export function loadAndRenderCommandConfirmationTemplate(
  request: CommandRequest
): string {
  const templatePath = join(__dirname, "templates/command_confirmation.html");

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
    .replace("{{command}}", request.command || "")
    .replace("{{relayer_data}}", encodedRelayerData);
}

export function loadAndRenderTransactionSuccessTemplate(
  txHash: string
): string {
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
