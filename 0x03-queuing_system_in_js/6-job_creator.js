import kue from 'kue';
const queue = kue.createQueue();

const jobData = {
  phoneNumber: '99999999',
  message: 'this is the phonenumber'
}

const job = queue.create('push_notification_code', jobData)
              .save((error) => {
                if (!error) console.log(`Notification job created: ${job.id}`);
              });

job.on('complete', () => console.log('Notification job completed'));
job.on('failed', () => console.log('Notification job failed'));
