document.addEventListener("DOMContentLoaded", () => {
  const podcastGrid = document.getElementById('podcastGrid');
  const episodesList = document.getElementById('episodesList');
  const refreshButton = document.getElementById('refreshButton');
  const filterButton = document.getElementById('filterButton');
  const cachedPodcasts = localStorage.getItem('podcasts');
  let filterActive = localStorage.getItem('filterActive') === 'true' ? true : false;

  const jsonFile = 'https://raw.githubusercontent.com/UmFzbXVz/pir8dio/main/docs/oversigtAfsnit.json';
  fetch(jsonFile)
    .then(response => response.json())
    .then(data => {
      if (cachedPodcasts) {
        displayPodcasts(JSON.parse(cachedPodcasts));
      } else {
        displayPodcasts(data);
        localStorage.setItem('podcasts', JSON.stringify(data));
      }
    });

  
  document.addEventListener("click", (event) => {
    if (event.target === modalContainer) {
      closeModal();
    }
  });

  refreshButton.addEventListener('click', () => {
    if (confirm('Vil du genopfriske afsnitlisterne?')) {
      fetch(jsonFile)
        .then(response => response.json())
        .then(data => {
          localStorage.setItem('podcasts', JSON.stringify(data));
          displayPodcasts(data);
        });
    }
  });

  filterButton.addEventListener('click', () => {
    filterActive = !filterActive;
    localStorage.setItem('filterActive', filterActive);
    filterPodcasts();
  });

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
    });
    
    filterPodcasts();

    const closeBtn = document.querySelectorAll('.close');
    closeBtn.forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal();
      });
    });
  }

  function openModal(slug, title) {
    const modal = document.getElementById('modalContainer');
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = title;
    modal.style.display = 'block';

    loadEpisodes(slug);
  }

  function closeModal() {
    const modal = document.getElementById('modalContainer');
    modal.style.display = 'none';
  }

    if (localStorage.getItem('filterActive') === null) {
    filterActive = false;
    localStorage.setItem('filterActive', filterActive);
  }
  
  function refreshPodcasts() {
    localStorage.removeItem('podcasts');
    document.querySelectorAll('.podcast').forEach(podcastDiv => {
      const slug = podcastDiv.dataset.slug;
      localStorage.removeItem(`episodes-${slug}`);
    });
    fetchPodcasts();
  }

  function loadEpisodes(slug, episodes) {
    const cachedEpisodes = localStorage.getItem(`episodes-${slug}`);
    if (cachedEpisodes) {
      displayEpisodes(JSON.parse(cachedEpisodes).episodes, slug);
    } else {
      localStorage.setItem(`episodes-${slug}`, JSON.stringify({
        episodes: episodes,
        count: episodes.length
      }));
      displayEpisodes(episodes, slug);
    }
  }

  function displayEpisodes(episodes, slug) {
    episodesList.innerHTML = '';
    const markedEpisodes = JSON.parse(localStorage.getItem(`markedEpisodes-${slug}`)) || [];
    episodes.forEach((episode, index) => {
      const episodeDiv = document.createElement('div');
      episodeDiv.className = 'episode';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `episode-${index}`;
      checkbox.value = episode.title;

      if (markedEpisodes.includes(`episode-${index}`)) {
        checkbox.checked = true;
      }

      episodeDiv.appendChild(checkbox);

      const title = document.createElement('label');
      title.textContent = episode.title;
      title.setAttribute('for', `episode-${index}`);
      episodeDiv.appendChild(title);

      checkbox.addEventListener('change', () => {
        updateEpisodeCount(slug);
        filterPodcasts();
      });

      episodesList.appendChild(episodeDiv);
    });
    updateEpisodeCount(slug);
  }

  function updateEpisodeCount(slug) {
    const markedEpisodes = document.querySelectorAll(`#episodesList input:checked`);
    const markedEpisodesArray = Array.from(markedEpisodes).map(checkbox => checkbox.id);
    localStorage.setItem(`markedEpisodes-${slug}`, JSON.stringify(markedEpisodesArray));

    const podcastDiv = document.querySelector(`.podcast[data-slug="${slug}"]`);
    if (podcastDiv) {
      const totalEpisodes = episodesList.querySelectorAll('.episode').length;
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
      markedEpisodes.forEach(episodeId => {
        const checkbox = document.getElementById(episodeId);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    });
  }

  initializeCheckboxes();
});
