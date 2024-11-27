const { transporter } = require("../utils/emailVerification");

const otpGenerator = async (email)=>{
    //generate otp
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //send email
    const mailOptions = {
      from: "farisrahman786687@gmail.com",
      to: email,
      subject: otp,
      text: `Your OTP is ${otp}. It will expire in 2 minutes.`,
    };
    await transporter.sendMail(mailOptions);

    return otp
}

module.exports = {otpGenerator}