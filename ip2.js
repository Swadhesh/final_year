const os = require('os');

function getIPv4Address() {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName of Object.keys(networkInterfaces)) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }
  return null; // Return null if no IPv4 address is found
}

const ipv4Address = getIPv4Address();
// console.log('IPv4 Address:', ipv4Address);
module.export =ipv4Address;
