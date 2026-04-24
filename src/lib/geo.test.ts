import { calculateDistance } from "./geo";

function testGeo() {
  const depotLat = 28.6139; // Delhi
  const depotLng = 77.209;
  
  // Point within 100m
  const nearLat = 28.6140;
  const nearLng = 77.2091;
  
  // Point far away
  const farLat = 28.7041; // Another part of Delhi
  const farLng = 77.1025;

  const d1 = calculateDistance(depotLat, depotLng, nearLat, nearLng);
  const d2 = calculateDistance(depotLat, depotLng, farLat, farLng);

  console.log(`Near distance: ${d1.toFixed(2)}m (Expected < 100m)`);
  console.log(`Far distance: ${d2.toFixed(2)}m (Expected > 5000m)`);

  if (d1 < 100 && d2 > 5000) {
    console.log("TEST PASSED");
  } else {
    console.log("TEST FAILED");
    process.exit(1);
  }
}

testGeo();
