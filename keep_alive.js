import { CronJob } from 'cron';
import https from 'https';

// Get the Render instance URL from environment variables
const render_url = process.env.RENDER_EXTERNAL_URL;

if (!render_url) {
    console.log("No RENDER_EXTERNAL_URL found. Please set it as an environment variable.");
}

const job = new CronJob('*/14 * * * *', function() {
    console.log('Making keep-alive call');

    https.get(render_url, (resp) => {
        if (resp.statusCode === 200) {
            console.log("Keep-alive call successful");
        } else {
            console.log("Keep-alive call failed");
        }
    }).on("error", (err) => {
        console.log("Error making keep-alive call:", err.message);
    });
});

export { job };

