export type CommandRequest = {
  email: string;
  command: string;
  verifier: string;
};

// TODO
export const fromEmailBody = async (
  emailBody: string
): Promise<CommandRequest> => {
  return {
    email: "",
    command: "",
    verifier: "",
  };
};
