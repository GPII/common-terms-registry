exports.appname = 'The Common Terms Registry';
exports.url = 'http://localhost:3000';
// port is needed for tests - providing the full url is usually enough
exports.port = 3000;

// email settings
exports.emailType = 'SMTP';
exports.emailSettings = {
    host: 'localhost',
    port: 25
};

exports.emailTemplate = 'blank';

// signup settings
exports.signupRoute = '/signup';
exports.signupTokenExpiration = 24 * 60 * 60 * 1000;

// forgot password settings
exports.forgotPasswordRoute = '/forgot-password';
exports.forgotPasswordTokenExpiration = 24 * 60 * 60 * 1000;

// database settings (CouchDB)
exports.db = 'couchdb';
exports.dbUrl = 'http://admin:admin@127.0.0.1:5984/_users';

// lock account
exports.failedLoginsWarning = 3;
exports.failedLoginAttempts = 5;
exports.accountLockedTime = 1000 * 60 * 20;

// email signup template
exports.emailSignup = {
    subject: 'Welcome to <%- appname %>',
    title: 'Welcome to <%- appname %>',
    text: [
	   '<h2>Hello <%- username %></h2>',
	   'Welcome to <%- appname %>.',
    '<p><%- link %> to complete your registration.</p>'
	   ].join(''),
    linkText: 'Click here'
};

// email already taken template
exports.emailSignupTaken = {
    subject: 'Email already registered',
    title: 'Email already registered',
    text: [
	   '<h2>Hello <%- username %></h2>',
	   'you or someone else tried to sign up for <%- appname %>.',
	   '<p>Your email is already registered and you cannot sign up twice.',
	   ' If you haven\'t tried to sign up, you can safely ignore this email. Everything is fine!</p>',
    '<p>The <%- appname %> Team</p>'
	   ].join('')
};

// resend signup template
exports.emailResendVerification = {
    subject: 'Complete your registration',
    title: 'Complete your registration',
    text: [
	   '<h2>Hello <%- username %></h2>',
	   'here is the link again. <%- link %> to complete your registration.',
    '<p>The <%- appname %> Team</p>'
	   ].join(''),
    linkText: 'Click here'
};

// forgot password template
exports.emailForgotPassword = {
    subject: 'Reset your password',
    title: 'Reset your password',
    text: [
	   '<h2>Hey <%- username %></h2>',
	   '<%- link %> to reset your password.',
    '<p>The <%- appname %> Team</p>'
	   ].join(''),
    linkText: 'Click here'
};