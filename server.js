const AWS = require('aws-sdk');
let config = require('./config.json');


function autoscaling(region) {
  AWS.config.update({region: region});
  let _autoscaling = new AWS.AutoScaling();
  return _autoscaling;
}


function ec2(region) {
  AWS.config.update({region: region});
  let _ec2 = new AWS.EC2();
  return _ec2;
}

function setAsgCapacity(region,asgName,capacity) {
  let params = {
    AutoScalingGroupName: asgName,
    DesiredCapacity: capacity
  }

  return autoscaling(region).updateAutoScalingGroup(params).promise();

}

async function serverUp(region) {
  let message;
  let asg = await getAutoscalingGroup(region);
  if (asg.DesiredCapacity == 1) {
    message = `Server already up on ${region}.`;
  } else {
    let params = {
      DesiredCapacity: 1
    }
    await setAsgCapacity(region,asg.AutoScalingGroupName,1);
    message = `Spinning up server on ${region}, hold tight!`;
  }

  return message;
}


async function serverDown(region) {
  let message;
  let asg = await getAutoscalingGroup(region);
  if (asg.DesiredCapacity == 0) {
    message = `Server already down on ${region}.`;
  } else {
    await setAsgCapacity(region,asg.AutoScalingGroupName,0);
    message = `Killing server on ${region}.`;
  }

  return message;  
}

async function serverStatus() {
  let message = [];
  for (region of config.supported_regions) {
    let asg = await getAutoscalingGroup(region);
    let ec2;
    let serverAddress;
    if (asg.Instances.length > 0 ) { 
      ec2 = await describeInstance(region,asg.Instances[0].InstanceId);
    }
    
    if(ec2) {
      serverAddress = `${ec2.PublicIpAddress}:27015 (${asg.Instances[0].LifecycleState})`
    } else {
      serverAddress = "None"
    }
    message.push(`Region: ${region} - Server: ${serverAddress}`);
  }
  return message.join("\n");
}

function getAutoscalingGroup(region) {
  return autoscaling(region).describeAutoScalingGroups({})
    .promise()
    .then( 
      data => data.AutoScalingGroups[0]
    );
}

function describeInstance(region, instanceId) {
  let params = {
    InstanceIds: [instanceId]
  }
  return ec2(region).describeInstances(params).promise().then(data => data.Reservations[0].Instances[0]);
}

module.exports = {
  serverUp,
  serverDown,
  serverStatus
}