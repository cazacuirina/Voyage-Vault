const nodemailer = require('nodemailer');
require('dotenv').config(); 

const sendFollowNotification = async (authorEmail, followerName) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_ADDRESS,
      to: authorEmail,
      subject: 'Congratulations! You are now a Premium Creator!',
      text: `Hello ${followerName},\n\nCongrats! You've reached over 1000 followers and have now become a Premium Creator. 🎉\n\nAs a Premium Creator, you can now monetize your content. You can set up subscription payments for your followers or set individual prices per post.💰\n\nDon't forget that the platform takes a small commission for every transaction.\n\nKeep up the great work!\n\nBest regards,\n🗺️Voyage Vault Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Follow notification email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendSubscriptionEmail = async (recipientEmail, recipientName, senderName, amount, isCreator) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    let subject, text;

    if (isCreator) {
      subject = 'New Subscription Payment Received!';
      text = `Hello ${recipientName},\n\nYou have just received a subscription payment of $${amount} from ${senderName}. 💰\n\nPlease note that a small commission is retained by the platform for each transaction.\n\nKeep creating awesome content!\n\nBest regards,\n🗺️Voyage Vault Team`;
    } else {
      subject = 'Subscription Payment Successful!';
      text = `Hello ${recipientName},\n\nYour subscription payment of $${amount} to ${senderName} was successful! 🎉\n\nYou now have access to premium content. Enjoy the exclusive benefits!\n\nBest regards,\n🗺️Voyage Vault Team`;
    }

    const mailOptions = {
      from: process.env.GMAIL_ADDRESS,
      to: recipientEmail,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log('Subscription email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendPostPaymentEmail = async (recipientEmail, recipientName, senderName, amount, postTitle, isAuthor) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    let subject, text;

    if (isAuthor) {
      subject = 'New Post Payment Received!';
      text = `Hello ${recipientName},\n\nYou have just received a payment of $${amount} for your post: "${postTitle}" from ${senderName}. 💰\n\nPlease note that a small commission is retained by the platform for each transaction.\n\nKeep up the great work!\n\nBest regards,\n🗺️Voyage Vault Team`;
    } else {
      subject = 'Post Payment Successful!';
      text = `Hello ${recipientName},\n\nYour payment of $${amount} for the post: "${postTitle}" by ${senderName} was successful! 🎉\n\nYou now have access to exclusive content from this post. Enjoy!\n\nBest regards,\n🗺️Voyage Vault Team`;
    }

    const mailOptions = {
      from: process.env.GMAIL_ADDRESS,
      to: recipientEmail,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log('Post payment email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendFollowNotification,
  sendSubscriptionEmail,
  sendPostPaymentEmail,
};