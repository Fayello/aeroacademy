const Docker = require('dockerode');
const docker = new Docker();

async function testIaC() {
  console.log('--- Testing IaC Image ---');
  try {
    const image = 'aeroacademy/iac-audit:latest';
    console.log(`Creating container with image ${image}...`);
    const container = await docker.createContainer({
      Image: image,
      name: `test-iac-${Date.now()}`,
      Cmd: ['terraform', '--version']
    });

    await container.start();
    const logs = await container.logs({ stdout: true, stderr: true });
    console.log('Terraform output:', logs.toString());
    
    await container.stop();
    await container.remove();
    console.log('IaC test complete');
  } catch (err) {
    console.error('IaC FAILED:', err);
  }
}

async function testAI() {
  console.log('\n--- Testing AI Image ---');
  try {
    const image = 'aeroacademy/adversarial-ai:latest';
    console.log(`Creating container with image ${image}...`);
    const container = await docker.createContainer({
      Image: image,
      name: `test-ai-${Date.now()}`,
      ExposedPorts: { '5000/tcp': {} },
      HostConfig: {
        PortBindings: { '5000/tcp': [{ HostPort: '5005' }] },
      },
    });

    await container.start();
    console.log('AI Container started on port 5005');
    
    // Simple health check wait
    await new Promise(r => setTimeout(r, 2000));
    
    // We can't easily fetch from here without a library like axios, 
    // but we can check if it's running
    const info = await container.inspect();
    console.log('AI Container status:', info.State.Running ? 'RUNNING' : 'FAILED');

    await container.stop();
    await container.remove();
    console.log('AI test complete');
  } catch (err) {
    console.error('AI FAILED:', err);
  }
}

async function run() {
  await testIaC();
  await testAI();
}

run();
