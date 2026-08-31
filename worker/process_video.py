import os
import requests
import subprocess
import tempfile
from supabase import create_client

# Supabase connection
SUPABASE_URL = 'https://azbauzivvqacistxzuyb.supabase.co'
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def download_file(url, suffix):
    """Download a file from URL to a temp file"""
    response = requests.get(url)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(response.content)
    tmp.close()
    return tmp.name

def process_job(job):
    """Process a single video job"""
    job_id = job['id']
    business_name = job['business_name']
    offer = job['offer']
    website_url = job['website_url']
    logo_url = job['logo_url']
    template_url = job['template_url']

    print(f"Processing job {job_id} for {business_name}")

    # Update status to processing
    supabase.table('video_jobs').update(
        {'status': 'processing'}
    ).eq('id', job_id).execute()

    try:
        # Download template video and logo
        template_path = download_file(template_url, '.mp4')
        logo_path = download_file(logo_url, '.png')
        output_path = tempfile.mktemp(suffix='.mp4')

        # FFmpeg command to overlay logo + text on video
        ffmpeg_cmd = [
            'ffmpeg', '-y',
            '-i', template_path,
            '-i', logo_path,
            '-filter_complex',
            f"""
            [1:v]scale=200:-1[logo];
            [0:v][logo]overlay=30:30[with_logo];
            [with_logo]drawtext=text='{business_name}':
            x=30:y=250:fontsize=36:fontcolor=white:
            shadowcolor=black:shadowx=2:shadowy=2[with_name];
            [with_name]drawtext=text='{offer}':
            x=30:y=300:fontsize=28:fontcolor=yellow:
            shadowcolor=black:shadowx=2:shadowy=2[with_offer];
            [with_offer]drawtext=text='{website_url}':
            x=30:y=345:fontsize=22:fontcolor=white:
            shadowcolor=black:shadowx=2:shadowy=2
            """,
            '-codec:a', 'copy',
            output_path
        ]

        # Run FFmpeg
        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"FFmpeg error: {result.stderr}")

        # Upload output video to Supabase
        output_filename = f"{job_id}_output.mp4"
        with open(output_path, 'rb') as f:
            supabase.storage.from_('outputs').upload(
                output_filename, f,
                {'content-type': 'video/mp4'}
            )

        # Get public URL
        output_url = supabase.storage.from_('outputs').get_public_url(
            output_filename
        )

        # Update job as done
        supabase.table('video_jobs').update({
            'status': 'done',
            'output_url': output_url
        }).eq('id', job_id).execute()

        print(f"✅ Job {job_id} completed!")

    except Exception as e:
        print(f"❌ Job {job_id} failed: {e}")
        supabase.table('video_jobs').update(
            {'status': 'failed'}
        ).eq('id', job_id).execute()

    finally:
        # Clean up temp files
        for path in [template_path, logo_path, output_path]:
            try:
                os.unlink(path)
            except:
                pass

def main():
    print("🎬 Video worker starting...")

    # Get all pending jobs
    response = supabase.table('video_jobs').select('*').eq(
        'status', 'pending'
    ).execute()

    jobs = response.data
    print(f"Found {len(jobs)} pending jobs")

    for job in jobs:
        # Skip jobs without template
        if not job.get('template_url'):
            print(f"Skipping job {job['id']} - no template URL")
            continue
        process_job(job)

    print("✅ Worker finished!")

if __name__ == '__main__':
    main()
