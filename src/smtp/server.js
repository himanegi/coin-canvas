const nodemailer = require("nodemailer");

const sendMail = async (email, otp) => {
  //Connect with the smtp etherial
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  //Checks the tranporter details whom to send and what to send
  let info = await transporter.sendMail({
    from: process.env.SECRET_MAIL,
    to: email,
    subject: "Email Verification",
    text: "One Time Password: " + otp,
    html: `<b>OTP Verification!</b><h1>${otp}</h1>`,
  });

  console.log("Message sent: %s", info.messageId);
};

module.exports = { sendMail };
