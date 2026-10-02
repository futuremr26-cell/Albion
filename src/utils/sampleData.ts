export interface SampleProject {
  id: string;
  name: string;
  description: string;
  businessProblem: string;
  objectives: string;
  data: Record<string, any>[];
  fileName: string;
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'ecommerce-profitability',
    name: 'E-Commerce Store: Profit Margins & Return Rate',
    description: 'Analyze order profitability, discount impacts, and customer return patterns.',
    businessProblem: `Our online retail store has experienced a 24% revenue surge over the last two quarters, but net operating margin dropped from 18% to 11%. We suspect aggressive promo discounting, rising product return rates in apparel, and increasing shipping carrier surcharges are eroding bottom-line margins.`,
    objectives: `- Determine net profit margin after discounts and refunds by product category.
- Identify customer segments with highest return rates and calculate lost revenue.
- Find the discount threshold (% off) beyond which customer orders become net-negative in contribution margin.
- Recommend inventory restocking adjustments based on high-margin fast movers.`,
    fileName: 'ecommerce_orders_q3_q4.csv',
    data: [
      { order_id: 'ORD-1001', customer_id: 'CUST-842', order_date: '2024-09-01', category: 'Apparel', product_name: 'Merino Wool Sweater', unit_price: 120, quantity: 2, discount_pct: 0.15, gross_revenue: 204, cogs: 80, shipping_cost: 12, returned: 'No', region: 'North America' },
      { order_id: 'ORD-1002', customer_id: 'CUST-311', order_date: '2024-09-02', category: 'Footwear', product_name: 'Trail Running Shoes', unit_price: 150, quantity: 1, discount_pct: 0.00, gross_revenue: 150, cogs: 65, shipping_cost: 10, returned: 'No', region: 'Europe' },
      { order_id: 'ORD-1003', customer_id: 'CUST-904', order_date: '2024-09-03', category: 'Apparel', product_name: 'Waterproof Rain Parka', unit_price: 220, quantity: 1, discount_pct: 0.35, gross_revenue: 143, cogs: 110, shipping_cost: 15, returned: 'Yes', region: 'North America' },
      { order_id: 'ORD-1004', customer_id: 'CUST-119', order_date: '2024-09-05', category: 'Accessories', product_name: 'Leather Weekend Bag', unit_price: 280, quantity: 1, discount_pct: 0.10, gross_revenue: 252, cogs: 95, shipping_cost: 18, returned: 'No', region: 'Asia-Pacific' },
      { order_id: 'ORD-1005', customer_id: 'CUST-652', order_date: '2024-09-07', category: 'Apparel', product_name: 'Cashmere Cardigan', unit_price: 180, quantity: 2, discount_pct: 0.40, gross_revenue: 216, cogs: 160, shipping_cost: 14, returned: 'Yes', region: 'Europe' },
      { order_id: 'ORD-1006', customer_id: 'CUST-774', order_date: '2024-09-08', category: 'Footwear', product_name: 'Classic Canvas Sneaker', unit_price: 75, quantity: 3, discount_pct: 0.20, gross_revenue: 180, cogs: 90, shipping_cost: 12, returned: 'No', region: 'North America' },
      { order_id: 'ORD-1007', customer_id: 'CUST-205', order_date: '2024-09-10', category: 'Electronics', product_name: 'Wireless ANC Earbuds', unit_price: 199, quantity: 1, discount_pct: 0.05, gross_revenue: 189, cogs: 85, shipping_cost: 8, returned: 'No', region: 'Europe' },
      { order_id: 'ORD-1008', customer_id: 'CUST-412', order_date: '2024-09-12', category: 'Accessories', product_name: 'Minimalist Polarized Sunglasses', unit_price: 95, quantity: 2, discount_pct: 0.25, gross_revenue: 142.5, cogs: 40, shipping_cost: 9, returned: 'No', region: 'Latin America' },
      { order_id: 'ORD-1009', customer_id: 'CUST-883', order_date: '2024-09-14', category: 'Apparel', product_name: 'Performance Chino Pants', unit_price: 98, quantity: 2, discount_pct: 0.10, gross_revenue: 176.4, cogs: 50, shipping_cost: 11, returned: 'No', region: 'North America' },
      { order_id: 'ORD-1010', customer_id: 'CUST-529', order_date: '2024-09-15', category: 'Footwear', product_name: 'Chelsea Leather Boots', unit_price: 240, quantity: 1, discount_pct: 0.30, gross_revenue: 168, cogs: 120, shipping_cost: 16, returned: 'Yes', region: 'North America' },
      { order_id: 'ORD-1011', customer_id: 'CUST-381', order_date: '2024-09-18', category: 'Electronics', product_name: 'Smart Fitness Tracker', unit_price: 130, quantity: 1, discount_pct: 0.00, gross_revenue: 130, cogs: 52, shipping_cost: 8, returned: 'No', region: 'Asia-Pacific' },
      { order_id: 'ORD-1012', customer_id: 'CUST-911', order_date: '2024-09-20', category: 'Apparel', product_name: 'Heavyweight Cotton Hoodie', unit_price: 85, quantity: 3, discount_pct: 0.20, gross_revenue: 204, cogs: 90, shipping_cost: 14, returned: 'No', region: 'Europe' },
      { order_id: 'ORD-1013', customer_id: 'CUST-104', order_date: '2024-09-22', category: 'Footwear', product_name: 'Hiking Waterproof Boots', unit_price: 210, quantity: 1, discount_pct: 0.15, gross_revenue: 178.5, cogs: 95, shipping_cost: 15, returned: 'No', region: 'North America' },
      { order_id: 'ORD-1014', customer_id: 'CUST-617', order_date: '2024-09-25', category: 'Accessories', product_name: 'Automatic Chrono Watch', unit_price: 350, quantity: 1, discount_pct: 0.05, gross_revenue: 332.5, cogs: 140, shipping_cost: 15, returned: 'No', region: 'Europe' },
      { order_id: 'ORD-1015', customer_id: 'CUST-723', order_date: '2024-09-28', category: 'Apparel', product_name: 'Silk Blend Blouse', unit_price: 140, quantity: 1, discount_pct: 0.50, gross_revenue: 70, cogs: 65, shipping_cost: 10, returned: 'Yes', region: 'North America' },
      { order_id: 'ORD-1016', customer_id: 'CUST-844', order_date: '2024-10-02', category: 'Electronics', product_name: 'Fast Wireless Charging Pad', unit_price: 45, quantity: 4, discount_pct: 0.10, gross_revenue: 162, cogs: 48, shipping_cost: 9, returned: 'No', region: 'Latin America' },
      { order_id: 'ORD-1017', customer_id: 'CUST-299', order_date: '2024-10-05', category: 'Footwear', product_name: 'Breathable Knit Runners', unit_price: 110, quantity: 2, discount_pct: 0.15, gross_revenue: 187, cogs: 70, shipping_cost: 12, returned: 'No', region: 'Asia-Pacific' },
      { order_id: 'ORD-1018', customer_id: 'CUST-551', order_date: '2024-10-08', category: 'Apparel', product_name: 'Down Insulated Jacket', unit_price: 260, quantity: 1, discount_pct: 0.30, gross_revenue: 182, cogs: 130, shipping_cost: 18, returned: 'Yes', region: 'Europe' },
      { order_id: 'ORD-1019', customer_id: 'CUST-192', order_date: '2024-10-12', category: 'Accessories', product_name: 'RFID Blocking Cardholder', unit_price: 40, quantity: 3, discount_pct: 0.00, gross_revenue: 120, cogs: 24, shipping_cost: 7, returned: 'No', region: 'North America' },
      { order_id: 'ORD-1020', customer_id: 'CUST-380', order_date: '2024-10-15', category: 'Footwear', product_name: 'Orthopedic Walking Shoes', unit_price: 165, quantity: 1, discount_pct: 0.10, gross_revenue: 148.5, cogs: 72, shipping_cost: 11, returned: 'No', region: 'Europe' }
    ]
  },
  {
    id: 'saas-churn-expansion',
    name: 'B2B SaaS: Churn Risk & ARR Expansion',
    description: 'Track Net Revenue Retention, usage drop-offs, and contract renewals.',
    businessProblem: `Mid-market SaaS renewal rates have dropped from 94% to 81% in the recent fiscal year. Customers are citing slow onboarding, underutilized seat licenses, and lack of team adoption. We need to identify accounts at risk before their 90-day renewal window.`,
    objectives: `- Calculate Net Revenue Retention (NRR) and Gross Retention Rate (GRR).
- Correlate active daily user counts (DAU/MAU) with renewal status.
- Pinpoint high-risk enterprise accounts with license utilization below 40%.
- Quantify expansion ARR potential by enterprise industry tier.`,
    fileName: 'saas_accounts_retention.csv',
    data: [
      { account_id: 'ACC-501', company: 'Acme Cloud', plan: 'Enterprise', seats_contracted: 100, seats_active: 88, mrr: 4500, signup_date: '2023-01-15', days_since_last_login: 2, nps_score: 9, churn_risk: 'Low', industry: 'Fintech' },
      { account_id: 'ACC-502', company: 'Zenith Labs', plan: 'Growth', seats_contracted: 40, seats_active: 12, mrr: 1800, signup_date: '2023-04-10', days_since_last_login: 19, nps_score: 5, churn_risk: 'High', industry: 'Healthcare' },
      { account_id: 'ACC-503', company: 'Helios Media', plan: 'Enterprise', seats_contracted: 250, seats_active: 220, mrr: 9800, signup_date: '2022-11-01', days_since_last_login: 1, nps_score: 10, churn_risk: 'Low', industry: 'Media' },
      { account_id: 'ACC-504', company: 'Apex Logistics', plan: 'Starter', seats_contracted: 15, seats_active: 14, mrr: 600, signup_date: '2023-08-20', days_since_last_login: 3, nps_score: 8, churn_risk: 'Low', industry: 'Logistics' },
      { account_id: 'ACC-505', company: 'Nova Retail', plan: 'Growth', seats_contracted: 50, seats_active: 18, mrr: 2100, signup_date: '2023-02-14', days_since_last_login: 28, nps_score: 4, churn_risk: 'Critical', industry: 'Retail' },
      { account_id: 'ACC-506', company: 'Pulse Analytics', plan: 'Enterprise', seats_contracted: 180, seats_active: 165, mrr: 7500, signup_date: '2022-09-05', days_since_last_login: 1, nps_score: 9, churn_risk: 'Low', industry: 'Software' },
      { account_id: 'ACC-507', company: 'Strata Security', plan: 'Growth', seats_contracted: 60, seats_active: 32, mrr: 2400, signup_date: '2023-06-11', days_since_last_login: 12, nps_score: 7, churn_risk: 'Medium', industry: 'Security' },
      { account_id: 'ACC-508', company: 'BioGenix Health', plan: 'Enterprise', seats_contracted: 300, seats_active: 95, mrr: 11000, signup_date: '2022-12-01', days_since_last_login: 22, nps_score: 3, churn_risk: 'Critical', industry: 'Healthcare' },
      { account_id: 'ACC-509', company: 'Vanguard Legal', plan: 'Starter', seats_contracted: 10, seats_active: 9, mrr: 450, signup_date: '2023-10-01', days_since_last_login: 2, nps_score: 8, churn_risk: 'Low', industry: 'Legal' },
      { account_id: 'ACC-510', company: 'Kite Robotics', plan: 'Growth', seats_contracted: 45, seats_active: 41, mrr: 1950, signup_date: '2023-05-19', days_since_last_login: 1, nps_score: 9, churn_risk: 'Low', industry: 'Hardware' }
    ]
  }
];
