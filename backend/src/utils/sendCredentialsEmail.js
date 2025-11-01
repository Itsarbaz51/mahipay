import EmailTemplates from "../emaiTemplates/emailTemplates.js";
import Helper from "./helper.js";

export async function sendCredentialsEmail(
  user,
  password,
  transactionPin,
  actionType = "created",
  customMessage = null
) {
  try {
    const emailContent = EmailTemplates.generateCredentialsTemplate({
      firstName: user.firstName,
      username: user.username,
      email: user.email,
      password: password,
      transactionPin: transactionPin,
      actionType: actionType,
      customMessage: customMessage,
    });

    await Helper.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    console.log(
      `Credentials email sent successfully for ${actionType} action to ${user.email}`
    );
  } catch (emailError) {
    console.error("Failed to send credentials email:", {
      userId: user.id,
      email: user.email,
      actionType: actionType,
      error: emailError.message,
    });
    throw emailError;
  }
}
