document.addEventListener("DOMContentLoaded", () => {
  const podcastGrid = document.getElementById('podcastGrid');
  const episodesList = document.getElementById('episodesList');
  const refreshButton = document.getElementById('refreshButton');
  const filterButton = document.getElementById('filterButton');
  let filterActive = localStorage.getItem('filterActive') === 'true';

  const jsonFile = 'https://raw.githubusercontent.com/UmFzbXVz/pir8dio/main/docs/oversigtAfsnit.json';

  fetchPodcasts();

  document.addEventListener("click", (event) => {
    if (event.target === modalContainer) {
      closeModal();
    }
  });

  refreshButton.addEventListener('click', () => {
    if (confirm('Vil du genopfriske afsnitlisterne?')) {
      refreshPodcasts();
    }
  });

  filterButton.addEventListener('click', () => {
    filterActive = !filterActive;
    localStorage.setItem('filterActive', filterActive);
    filterPodcasts();
  });

  function fetchPodcasts() {
    fetch(jsonFile)
      .then(response => response.json())
      .then(data => {
        if (localStorage.getItem('podcasts')) {
          const cachedPodcasts = JSON.parse(localStorage.getItem('podcasts'));
          displayPodcasts(cachedPodcasts);
        } else {
          displayPodcasts(data);
          localStorage.setItem('podcasts', JSON.stringify(data));
        }
      });
  }

  function refreshPodcasts() {
    fetch(jsonFile)
      .then(response => response.json())
      .then(newData => {
        const existingData = JSON.parse(localStorage.getItem('podcasts')) || [];
        const mergedData = mergePodcastData(existingData, newData);
        localStorage.setItem('podcasts', JSON.stringify(mergedData));
        displayPodcasts(mergedData);
      });
  }

  function mergePodcastData(existingData, newData) {
    const existingMap = new Map(existingData.map(podcast => [podcast.slug, podcast]));
    newData.forEach(newPodcast => {
      if (existingMap.has(newPodcast.slug)) {
        const existingPodcast = existingMap.get(newPodcast.slug);
        const newEpisodes = newPodcast.episodes.filter(
          newEpisode => !existingPodcast.episodes.some(existingEpisode => existingEpisode.title === newEpisode.title)
        );
        existingPodcast.episodes = existingPodcast.episodes.concat(newEpisodes);
        existingPodcast.episodes.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      } else {
        newPodcast.episodes.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        existingMap.set(newPodcast.slug, newPodcast);
      }
    });
    return Array.from(existingMap.values());
  }

  function displayPodcasts(podcasts) {
    podcastGrid.innerHTML = '';
    podcasts.forEach(podcast => {
      const podcastDiv = document.createElement('div');
      podcastDiv.className = 'podcast';
      podcastDiv.dataset.slug = podcast.slug;

      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      const image = document.createElement('img');
      image.src = podcast.image;
      imageContainer.appendChild(image);
      podcastDiv.appendChild(imageContainer);

      const episodesCount = document.createElement('div');
      episodesCount.className = 'episodes-count';
      episodesCount.textContent = '0 / 0';
      podcastDiv.appendChild(episodesCount);

      podcastDiv.addEventListener('click', () => {
        openModal(podcast.slug, podcast.title);
      });

      podcastGrid.appendChild(podcastDiv);

      loadEpisodes(podcast.slug, podcast.episodes);
      
        const closeBtn = document.querySelector('.close');
  closeBtn.addEventListener('click', () => {
    closeModal();
  });
    });
    
    filterPodcasts();
  }

function openModal(slug, title) {
  const modal = document.getElementById('modalContainer');
  const modalTitle = document.getElementById('modalTitle');
  modalTitle.textContent = title;
  modal.style.display = 'block';

  const markAllButton = document.createElement('button');
  markAllButton.id = 'markAllButton';
  markAllButton.textContent = '✓';
  markAllButton.addEventListener('click', () => {
    markAllEpisodes(slug);
  });

  const episodesListContainer = document.getElementById('episodesListContainer');
  episodesListContainer.innerHTML = ''; // Clear previous content
  episodesListContainer.appendChild(markAllButton);
  episodesListContainer.appendChild(episodesList);

  const podcast = JSON.parse(localStorage.getItem('podcasts')).find(podcast => podcast.slug === slug);
  loadEpisodes(slug, podcast.episodes);
}

function markAllEpisodes(slug) {
  const allCheckboxes = document.querySelectorAll(`#episodesList input[type="checkbox"]`);
  allCheckboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  updateEpisodeCount(slug);
  filterPodcasts();
}

  function closeModal() {
    const modal = document.getElementById('modalContainer');
    modal.style.display = 'none';
  }

  function loadEpisodes(slug, episodes) {
    episodes.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    localStorage.setItem(`episodes-${slug}`, JSON.stringify({
      episodes: episodes,
      count: episodes.length
    }));
    displayEpisodes(episodes, slug);
  }

 function displayEpisodes(episodes, slug) {
  episodesList.innerHTML = '';
  const markedEpisodes = JSON.parse(localStorage.getItem(`markedEpisodes-${slug}`)) || [];
  episodes.forEach((episode, index) => {
    const episodeDiv = document.createElement('div');
    episodeDiv.className = 'episode';

    const episodeLabelDiv = document.createElement('div');
    episodeLabelDiv.className = 'episode-label-div';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `episode-${index}`;
    checkbox.value = episode.title;

    if (markedEpisodes.includes(episode.title)) {
      checkbox.checked = true;
    }

    const title = document.createElement('label');
    title.textContent = episode.title;
    title.setAttribute('for', `episode-${index}`);

    episodeLabelDiv.appendChild(checkbox);
    episodeLabelDiv.appendChild(title);

    episodeLabelDiv.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked;
      updateEpisodeCount(slug);
      filterPodcasts();
    });

    episodeDiv.appendChild(episodeLabelDiv);
    episodesList.appendChild(episodeDiv);
  });
  updateEpisodeCount(slug);
}


  function updateEpisodeCount(slug) {
    const markedEpisodes = document.querySelectorAll(`#episodesList input:checked`);
    const markedEpisodesArray = Array.from(markedEpisodes).map(checkbox => checkbox.value);
    localStorage.setItem(`markedEpisodes-${slug}`, JSON.stringify(markedEpisodesArray));

    const podcastDiv = document.querySelector(`.podcast[data-slug="${slug}"]`);
    if (podcastDiv) {
      const totalEpisodes = JSON.parse(localStorage.getItem(`episodes-${slug}`)).count;
      const episodesCount = podcastDiv.querySelector('.episodes-count');
      episodesCount.textContent = `${markedEpisodesArray.length} / ${totalEpisodes}`;

      if (markedEpisodesArray.length === totalEpisodes) {
        let checkmark = podcastDiv.querySelector('.checkmark');
        if (!checkmark) {
          checkmark = document.createElement('span');
          checkmark.className = 'checkmark';
          checkmark.textContent = '✓';
          podcastDiv.appendChild(checkmark);
        }
      } else {
        const checkmark = podcastDiv.querySelector('.checkmark');
        if (checkmark) {
          checkmark.remove();
        }
      }
    }
  }

  function filterPodcasts() {
    const allPodcasts = document.querySelectorAll('.podcast');
    allPodcasts.forEach(podcastDiv => {
      const slug = podcastDiv.dataset.slug;
      const markedEpisodes = JSON.parse(localStorage.getItem(`markedEpisodes-${slug}`)) || [];
      const totalEpisodes = JSON.parse(localStorage.getItem(`episodes-${slug}`))?.count || 0;

      if (filterActive && markedEpisodes.length === totalEpisodes && totalEpisodes > 0) {
        podcastDiv.style.display = 'none';
      } else {
        podcastDiv.style.display = 'block';
      }
    });
  }

  function initializeCheckboxes() {
    const allPodcasts = document.querySelectorAll('.podcast');
    allPodcasts.forEach(podcastDiv => {
      const slug = podcastDiv.dataset.slug;
      const markedEpisodes = JSON.parse(localStorage.getItem(`markedEpisodes-${slug}`)) || [];
      markedEpisodes.forEach(episodeTitle => {
        const checkbox = document.querySelector(`#episodesList input[value="${episodeTitle}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    });
  }

  initializeCheckboxes();
});
