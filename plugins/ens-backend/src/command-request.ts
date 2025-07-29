import { unescape } from "html-escaper";
import { decode } from "quoted-printable";

export type CommandRequest = {
  email: string;
  command: string;
  verifier: string;
};

/// Extracts the command request from the email body
export const fromEmailBody = async (
  emailBody: string
): Promise<CommandRequest> => {
  const cleanBody = decode(emailBody);
  console.info("Clean body:", cleanBody);

  // Extract relayer data from the hidden div using regex
  const re = new RegExp(
    '<div[^>]*id="[^"]*relayer-data[^"]*"[^>]*>(.*?)</div>'
  );

  const match = cleanBody.match(re);
  if (!match) {
    throw new Error("Relayer data extraction failed");
  }

  const relayerData = match[1];

  let decodedRelayerData = unescape(relayerData);

  // Extract email from HTML anchor tag if present
  const anchorRegex = new RegExp("<a[^>]*>([^<]+)</a>");
  decodedRelayerData = decodedRelayerData.replace(anchorRegex, "$1");

  const commandRequest = JSON.parse(decodedRelayerData);
  return commandRequest;
};
