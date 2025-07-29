import { InboxHandler, InboxHandlerDeps } from "./types";
import { unescape } from "html-escaper";
import { decode } from "quoted-printable";

export const createInboxHandler =
  ({
    smtpService,
    proverService,
    verifierService,
    templateService,
  }: InboxHandlerDeps): InboxHandler =>
  async (request) => {
    console.info("Received inbox request", request);

    const commandRequest = await fromEmailBody(request.emailBody);

    const proofResponse = await proverService.generateProof(request.emailBody);

    const { txHash } = await verifierService.verifyProof(
      commandRequest.verifier,
      proofResponse.proof,
      proofResponse.publicOutputs
    );

    await smtpService.sendRequest({
      to: commandRequest.email,
      subject: "Your Request has been Completed",
      bodyPlain: `Your request has been successfully processed. Transaction hash: ${txHash}`,
      bodyHtml: await templateService.loadAndRenderTemplate(
        "transaction_success.html",
        {
          ["tx_hash"]: txHash,
        }
      ),
    });

    return "success";
  };

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
