addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * @param {Request} request
 * @param {string} name
 */
var index;
const COOKIE_NAME = 'variant'
async function handleRequest(request) {
  // Fetching URLs from the link
  const res = await fetch("https://cfw-takehome.developers.workers.dev/api/variants");
  const res_text = await res.text();
  // Storing it the form of JSON
  const res_json = JSON.parse(res_text);  
  /* Implementing Persistent variants. Checking if the user has already visited the page,
     if yes the user will get same page again. Else a new random variant is assigned as it 
     is the first time user is visiting the page
  */
  const cookie = getCookie(request, COOKIE_NAME);
  let response;
  if (cookie) {
    response = await fetch(res_json['variants'][cookie]);
  }
  else {
    /* Distributing requests in A/B testing style and
       Returning each variant around 50% of the time and setting the cookie
    */
    index = Math.random() > 0.5 ? 1 : 0;
    response = await fetch(res_json['variants'][index]);
    response = new Response(response.body, response);
    response.headers.set('Set-Cookie', `variant=${index}; Expires=Wed, 21 July 2020 07:28:00 GMT; path=/`)
  }
  // Using HTMLRewritter to customize the page
  let response_final = rewriter.transform(response);
  return response_final;
}

class ElementHandler
{
  element(element) {
    element.setAttribute('href', 'https://www.cloudflare.com/gaming/');
    element.setInnerContent('Return to Cloudflare for Gaming');
  }
}

const rewriter = new HTMLRewriter()
  .on('title', {element(element){element.setInnerContent(`Cloudflare Gaming Variant ${index+1}`);}})
  .on('h1#title', {element(element){element.setInnerContent(`Welcome Cloudflare Gaming Variant ${index+1}`);}})
  .on('p#description', {element(element){element.setInnerContent('This will redirect you to Cloudflare for Gaming');}})
  .on('a#url', new ElementHandler())

function getCookie(request, name) {
  let result = null
  let cookieString = request.headers.get('Cookie')
  if (cookieString) {
    let cookies = cookieString.split(';')
    cookies.forEach(cookie => {
      let cookieName = cookie.split('=')[0].trim()
      if (cookieName === name) {
        let cookieVal = cookie.split('=')[1]
        result = cookieVal
      }
    })
  }
  return result
}