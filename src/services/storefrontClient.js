/**
 * Storefront API Client SDK
 * 
 * Use this lightweight client in any custom frontend (Next.js, Astro, Remix, Vue, Mobile React Native)
 * to communicate with your Shopify Engine backend.
 */

export class StorefrontClient {
  constructor({ endpoint, storeDomain }) {
    this.endpoint = endpoint || 'http://localhost:3000';
    this.storeDomain = storeDomain;
  }

  // Fetch product catalog for the store
  async getProducts() {
    const res = await fetch(`${this.endpoint}/admin/api/2024-01/products.json`, {
      headers: {
        'x-shopify-shop-domain': this.storeDomain,
        'Content-Type': 'application/json'
      }
    });
    return res.json();
  }

  // Fetch single product by handle
  async getProductByHandle(handle) {
    const data = await this.getProducts();
    return data.products.find((p) => p.handle === handle) || null;
  }

  // Create checkout session
  async createCheckout({ lineItems, customer, shippingAddress }) {
    const res = await fetch(`${this.endpoint}/api/storefront/checkout`, {
      method: 'POST',
      headers: {
        'x-shopify-shop-domain': this.storeDomain,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkout: {
          line_items: lineItems,
          customer,
          shipping_address: shippingAddress
        }
      })
    });
    return res.json();
  }
}

export default StorefrontClient;
