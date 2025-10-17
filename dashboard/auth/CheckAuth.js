module.exports = async (req, res, next) => {
  if (!req.session.user) {
    if (process.env.DASHBOARD_DEV_MODE === "true" && !process.env.BOT_SECRET) {
      req.session.user = {
        id: "000000000000000000",
        username: "Developer",
        discriminator: "0000",
        avatar: null,
        guilds: []
      };
      return next();
    }
    
    const redirectURL = req.originalUrl.includes("login") || req.originalUrl === "/" ? "/selector" : req.originalUrl;
    const state = Math.random().toString(36).substring(5);
    req.client.states[state] = redirectURL;
    return res.redirect(`/api/login?state=${state}`);
  }
  return next();
};
