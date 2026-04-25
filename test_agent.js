const BASE = 'http://localhost:3000';

async function fullFlowTest() {
  console.log("=== FULL FLOW SIMULATION TEST ===\n");

  // Step 1: Create Order
  console.log("1. Creating payment order...");
  const orderRes = await fetch(`${BASE}/api/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'mock_user_001', amount: 50 })
  });
  const orderData = await orderRes.json();
  console.log("   Order:", JSON.stringify(orderData));
  if (!orderData.success) { console.error("FAIL: Order creation failed"); return; }

  // Step 2: Verify Payment (simulation)
  console.log("\n2. Verifying simulated payment...");
  const verifyRes = await fetch(`${BASE}/api/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: orderData.orderId,
      razorpay_payment_id: 'sim_pay_' + Date.now(),
      razorpay_signature: 'sim_sig',
      paymentDocId: orderData.paymentDocId,
      isSimulation: true
    })
  });
  const verifyData = await verifyRes.json();
  console.log("   Verify:", JSON.stringify(verifyData));
  if (!verifyData.success) { console.error("FAIL: Verification failed"); return; }

  // Step 3: Create Request (triggers AI Agent)
  console.log("\n3. Creating crisis request (triggers AI Agent)...");
  const requestRes = await fetch(`${BASE}/api/create-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'mock_user_001',
      text: 'Gas leak at central market. People need evacuation.',
      lat: 28.6139,
      lng: 77.2090,
      paymentDocId: orderData.paymentDocId
    })
  });
  const requestData = await requestRes.json();
  console.log("   Request:", JSON.stringify(requestData, null, 2));

  // Step 4: List Requests (validator panel)
  console.log("\n4. Listing pending requests (validator view)...");
  const listRes = await fetch(`${BASE}/api/list-requests?isSimulation=true`);
  const listData = await listRes.json();
  console.log("   Pending requests:", listData.requests?.length || 0);
  if (listData.requests?.length > 0) {
    const r = listData.requests[0];
    console.log(`   First: Risk=${r.risk}, Bounty=₹${r.bounty}, Status=${r.agentStatus}`);
  }

  console.log("\n=== TEST COMPLETE ===");
}

fullFlowTest();
