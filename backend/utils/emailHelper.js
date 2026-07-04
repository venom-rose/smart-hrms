const sendLeaveStatusEmail = (toEmail, employeeName, status, reason, comments) => {
  console.log(`
  +-----------------------------------------------------------+
  |                   [HR TRANS-EMAIL DISPATCH]               |
  +-----------------------------------------------------------+
  | To:       ${toEmail.padEnd(46)} |
  | Subject:  Leave Request Update: ${status.toUpperCase().padEnd(25)} |
  +-----------------------------------------------------------+
  | Dear ${employeeName},
  |
  | Your leave application has been processed.
  |
  | Status:   ${status}
  | Reason:   ${reason}
  | Remarks:  ${comments || 'No remarks provided by HR.'}
  |
  | Best regards,
  | Smart HRMS Corporate System
  +-----------------------------------------------------------+
  `);
  return true;
};

module.exports = { sendLeaveStatusEmail };
