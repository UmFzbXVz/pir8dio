import json
import os
import xml.etree.ElementTree as ET
import xml.dom.minidom
from datetime import datetime

ITUNES_NAMESPACE = "http://www.itunes.com/dtds/podcast-1.0.dtd"
ET.register_namespace('itunes', ITUNES_NAMESPACE)

def seconds_to_hhmmss(seconds):
    hours, remainder = divmod(round(float(seconds)), 3600)
    minutes, seconds = divmod(remainder, 60)
    if hours == 0:
        return "{:02d}:{:02d}".format(minutes, seconds)
    else:
        return "{:02d}:{:02d}:{:02d}".format(hours, minutes, seconds)

def datetime_to_rfc822(dt):
    return dt.strftime('%a, %d %b %Y %H:%M:%S +0000')

def generate_rss(podcast_data):
    rss = ET.Element("rss", version="2.0")
    channel = ET.SubElement(rss, "channel")
    title = ET.SubElement(channel, "title")
    title.text = podcast_data['title'].strip()

    link = ET.SubElement(channel, "link")
    link.text = podcast_data['program_url'].strip()
    description = ET.SubElement(channel, "description")
    description.text = podcast_data['content'].strip()
    image = ET.SubElement(channel, "{%s}image" % ITUNES_NAMESPACE)
    image.set("href", podcast_data['image'].strip())

    existing_guids = set()  # Bruges til at gemme eksisterende GUID'er

    for episode in podcast_data['episodes']:
        episode_guid = str(episode['id'])

        # Spring episoden over, hvis GUID'en allerede eksisterer
        if episode_guid in existing_guids:
            continue

        item = ET.SubElement(channel, "item")
        episode_title = ET.SubElement(item, "title")
        episode_title.text = episode['title'].strip()
        episode_description = ET.SubElement(item, "description")
        episode_description.text = episode['content'].strip()
        pub_date = ET.SubElement(item, "pubDate")
        pub_date.text = datetime_to_rfc822(datetime.strptime(episode['publishedAt'], '%Y-%m-%dT%H:%M:%S.%fZ')).strip()

        # Tilføj GUID-element
        guid = ET.SubElement(item, "guid")
        guid.text = episode_guid
        guid.set("isPermaLink", "false")

        enclosure = ET.SubElement(item, "enclosure")
        enclosure.set("url", episode['premiumAudio'].strip())
        enclosure.set("length", "0")
        enclosure.set("type", "audio/mpeg")

        itunes_duration = ET.SubElement(item, "{%s}duration" % ITUNES_NAMESPACE)
        itunes_duration.text = seconds_to_hhmmss(episode['duration']).strip()

        existing_guids.add(episode_guid)  # Tilføj GUID'en til sættet

    rss_content = ET.tostring(rss, encoding='utf-8')
    return xml.dom.minidom.parseString(rss_content).toprettyxml(indent="  ")

def generate_rss_files(data_file):
    folder_name = "pir8dio"
    try:
        if not os.path.exists(folder_name):
            os.makedirs(folder_name)

        with open(data_file, 'r', encoding='utf-8') as file:
            data = json.load(file)
            for podcast in data:
                rss_filename = f"{folder_name}/{podcast['slug']}.rss"
                rss_content = generate_rss(podcast)
                with open(rss_filename, 'w', encoding='utf-8') as rss_file:
                    rss_file.write(rss_content)
                print(f"RSS-fil '{rss_filename}' genereret med succes.")
    except FileNotFoundError:
        print("Datafilen blev ikke fundet.")
    except Exception as e:
        print(f"Der opstod en fejl: {str(e)}")

if __name__ == "__main__":
    data_file = "data.json"
    generate_rss_files(data_file)
