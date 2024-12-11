import json
import os
import requests

def add_url_to_podcasts():
    url = "https://r8dio.demo.supertusch.com/podcasts"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        updated_podcasts_info = []
        for entry in data:
            slug = entry.get('slug', 'N/A')
            episodes_url = f"https://r8dio.demo.supertusch.com/podcasts/{slug}/episodes"
            program_url = f"https://r8dio.dk/program/{slug}"
            # Hent episodernes data fra API'en
            episodes_response = requests.get(episodes_url)
            if episodes_response.status_code == 200:
                episodes = episodes_response.json()
                # Tilføj information om podcasts med episoder
                updated_podcasts_info.append({
                    'title': entry['title'],
                    'image': entry.get('image', 'N/A'),
                    'content': entry.get('content', 'N/A'),
                    'slug': slug,
                    'url': episodes_url,
                    'program_url': program_url,
                    'episodes': episodes
                })
            else:
                # Hvis hentning af episoder mislykkes
                print(f"Kunne ikke hente episoder for podcast '{entry['title']}'")
        return updated_podcasts_info
    else:
        # Hvis hentning af podcastinformation mislykkes
        print("Kunne ikke hente podcastinformation fra API'en.")
        return []

# Hent podcasts med URL-tilføjelse
podcasts_info_with_url = add_url_to_podcasts()

if podcasts_info_with_url:
    # Gem informationen i en JSON-fil
    with open('data.json', 'w', encoding='utf-8') as output_file:
        json.dump(podcasts_info_with_url, output_file, indent=2)
else:
    print("Ingen podcastinformation fundet.")
