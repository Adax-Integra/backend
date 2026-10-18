/*
R-06: public address of this API, used to build the document links.
*/
function publicBaseUrl(req) {
  const configured = process.env.PUBLIC_API_URL;
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
}

export default publicBaseUrl;
