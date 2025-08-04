import { InboxHandler, InboxHandlerDeps } from "./types";
import { unescape } from "html-escaper";
import { decode } from "quoted-printable";

export const createInboxHandler =
  ({
    smtpService,
    proverService,
    verifierService,
    templateService,
    loggerService,
  }: InboxHandlerDeps): InboxHandler =>
  async (request) => {
    loggerService.info("Received inbox request", request);

    const { email, verifier } = await commandRequestFromRawEmail(
      request.rawEmail
    );

    const proverResponse = await proverService.generateProof(request.rawEmail);

    const { txHash } = await verifierService.verifyProof({
      verifierAddress: verifier,
      proverResponse,
    });

    await smtpService.sendRequest({
      to: email,
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

type CommandRequest = {
  email: string;
  command: string;
  verifier: string;
};

export const commandRequestFromRawEmail = async (
  rawEmail: string
): Promise<CommandRequest> => {
  const cleanedEmail = decode(rawEmail);

  // Extract relayer data from the hidden div using regex
  const re = new RegExp(
    '<div[^>]*id="[^"]*relayer-data[^"]*"[^>]*>(.*?)</div>'
  );

  const match = cleanedEmail.match(re);
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
