import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';

type MusicService = 'yandex' | 'vk' | 'mts' | null;
type Screen = 'home' | 'search' | 'results' | 'player' | 'favorites' | 'downloads';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  service: MusicService;
  isOffline?: boolean;
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedService, setSelectedService] = useState<MusicService>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [progress, setProgress] = useState([30]);
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [downloads, setDownloads] = useState<Track[]>([]);

  const mockTracks: Track[] = [
    { id: '1', title: 'Последний танец', artist: 'Макс Корж', duration: '3:45', service: selectedService },
    { id: '2', title: 'Малиновый закат', artist: 'Cream Soda', duration: '4:12', service: selectedService },
    { id: '3', title: 'Мокрые кроссы', artist: 'Лауд', duration: '3:28', service: selectedService },
    { id: '4', title: 'Холодное сердце', artist: 'Miyagi & Andy Panda', duration: '4:01', service: selectedService },
    { id: '5', title: 'Лети', artist: 'Zivert', duration: '3:15', service: selectedService },
  ];

  const handleServiceSelect = (service: MusicService) => {
    setSelectedService(service);
    setCurrentScreen('search');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentScreen('results');
    }
  };

  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentScreen('player');
  };

  const toggleFavorite = (track: Track) => {
    if (favorites.find(t => t.id === track.id)) {
      setFavorites(favorites.filter(t => t.id !== track.id));
    } else {
      setFavorites([...favorites, track]);
    }
  };

  const handleDownload = (track: Track) => {
    const offlineTrack = { ...track, isOffline: true };
    if (!downloads.find(t => t.id === track.id)) {
      setDownloads([...downloads, offlineTrack]);
    }
  };

  const isFavorite = (trackId: string) => favorites.find(t => t.id === trackId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto pb-24">
        {currentScreen === 'home' && (
          <div className="animate-fade-in p-6 space-y-8">
            <div className="text-center space-y-2 pt-12">
              <div className="text-6xl mb-4">🎵</div>
              <h1 className="text-3xl font-bold gradient-purple bg-clip-text text-transparent">
                Music Bot
              </h1>
              <p className="text-muted-foreground">Выберите сервис для поиска музыки</p>
            </div>

            <div className="space-y-4">
              <Card 
                className="gradient-card p-6 cursor-pointer hover-scale border-2 border-transparent hover:border-primary transition-all"
                onClick={() => handleServiceSelect('yandex')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-purple flex items-center justify-center text-2xl">
                    🟡
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Яндекс Музыка</h3>
                    <p className="text-sm text-muted-foreground">80+ млн треков</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="gradient-card p-6 cursor-pointer hover-scale border-2 border-transparent hover:border-primary transition-all"
                onClick={() => handleServiceSelect('vk')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-purple flex items-center justify-center text-2xl">
                    🔵
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">ВКонтакте</h3>
                    <p className="text-sm text-muted-foreground">Музыка VK</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="gradient-card p-6 cursor-pointer hover-scale border-2 border-transparent hover:border-primary transition-all"
                onClick={() => handleServiceSelect('mts')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-purple flex items-center justify-center text-2xl">
                    🔴
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">МТС Музыка</h3>
                    <p className="text-sm text-muted-foreground">Коллекция треков</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {currentScreen === 'search' && (
          <div className="animate-fade-in p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentScreen('home')}
                className="hover-scale"
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <h2 className="text-2xl font-bold">
                {selectedService === 'yandex' && '🟡 Яндекс Музыка'}
                {selectedService === 'vk' && '🔵 ВКонтакте'}
                {selectedService === 'mts' && '🔴 МТС Музыка'}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Название трека или исполнитель..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-11 h-12 bg-card border-border"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="w-full h-12 gradient-purple hover-scale font-semibold"
              >
                Найти музыку
              </Button>
            </div>

            {searchQuery && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Популярные запросы</h3>
                <div className="flex flex-wrap gap-2">
                  {['Макс Корж', 'Cream Soda', 'Zivert', 'Miyagi'].map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover-scale"
                      onClick={() => {
                        setSearchQuery(tag);
                        handleSearch();
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentScreen === 'results' && (
          <div className="animate-fade-in p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentScreen('search')}
                className="hover-scale"
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div>
                <h2 className="text-xl font-bold">Результаты</h2>
                <p className="text-sm text-muted-foreground">Найдено {mockTracks.length} треков</p>
              </div>
            </div>

            <div className="space-y-3">
              {mockTracks.map((track) => (
                <Card key={track.id} className="gradient-card p-4 animate-scale-in">
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handlePlayTrack(track)}
                      className="hover-scale gradient-purple rounded-xl"
                    >
                      <Icon name="Play" size={20} />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{track.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{track.duration}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleFavorite(track)}
                      className="hover-scale"
                    >
                      <Icon 
                        name={isFavorite(track.id) ? "Heart" : "Heart"} 
                        size={18}
                        className={isFavorite(track.id) ? "fill-primary text-primary" : ""}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownload(track)}
                      className="hover-scale"
                    >
                      <Icon name="Download" size={18} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentScreen === 'player' && currentTrack && (
          <div className="animate-slide-up p-6 space-y-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentScreen('results')}
                className="hover-scale"
              >
                <Icon name="ChevronDown" size={24} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => toggleFavorite(currentTrack)}
                className="hover-scale"
              >
                <Icon 
                  name="Heart" 
                  size={20}
                  className={isFavorite(currentTrack.id) ? "fill-primary text-primary" : ""}
                />
              </Button>
            </div>

            <div className="text-center space-y-4">
              <div className="w-64 h-64 mx-auto rounded-3xl gradient-purple flex items-center justify-center text-8xl animate-scale-in shadow-2xl">
                🎵
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{currentTrack.title}</h2>
                <p className="text-lg text-muted-foreground">{currentTrack.artist}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1:23</span>
                <span>{currentTrack.duration}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="hover-scale"
              >
                <Icon name="Shuffle" size={24} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="hover-scale"
              >
                <Icon name="SkipBack" size={28} />
              </Button>
              <Button
                size="icon"
                className="w-16 h-16 rounded-full gradient-purple hover-scale"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                <Icon name={isPlaying ? "Pause" : "Play"} size={28} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="hover-scale"
              >
                <Icon name="SkipForward" size={28} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="hover-scale"
              >
                <Icon name="Repeat" size={24} />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Icon name="Volume2" size={20} className="text-muted-foreground" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-8">{volume[0]}</span>
            </div>
          </div>
        )}

        {currentScreen === 'favorites' && (
          <div className="animate-fade-in p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentScreen('home')}
                className="hover-scale"
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div>
                <h2 className="text-xl font-bold">Избранное</h2>
                <p className="text-sm text-muted-foreground">{favorites.length} треков</p>
              </div>
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="text-6xl">💜</div>
                <p className="text-muted-foreground">Добавьте треки в избранное</p>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map((track) => (
                  <Card key={track.id} className="gradient-card p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePlayTrack(track)}
                        className="hover-scale gradient-purple rounded-xl"
                      >
                        <Icon name="Play" size={20} />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{track.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleFavorite(track)}
                        className="hover-scale"
                      >
                        <Icon name="Heart" size={18} className="fill-primary text-primary" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {currentScreen === 'downloads' && (
          <div className="animate-fade-in p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentScreen('home')}
                className="hover-scale"
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div>
                <h2 className="text-xl font-bold">Загрузки</h2>
                <p className="text-sm text-muted-foreground">{downloads.length} треков офлайн</p>
              </div>
            </div>

            {downloads.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="text-6xl">📥</div>
                <p className="text-muted-foreground">Скачайте треки для офлайн прослушивания</p>
              </div>
            ) : (
              <div className="space-y-3">
                {downloads.map((track) => (
                  <Card key={track.id} className="gradient-card p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePlayTrack(track)}
                        className="hover-scale gradient-purple rounded-xl"
                      >
                        <Icon name="Play" size={20} />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{track.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Icon name="Download" size={12} />
                        Офлайн
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
          <div className="max-w-md mx-auto px-6 py-4">
            <div className="flex items-center justify-around">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentScreen('home')}
                className={currentScreen === 'home' ? 'text-primary' : ''}
              >
                <Icon name="Home" size={24} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentScreen('search')}
                className={currentScreen === 'search' ? 'text-primary' : ''}
              >
                <Icon name="Search" size={24} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentScreen('favorites')}
                className={currentScreen === 'favorites' ? 'text-primary' : ''}
              >
                <Icon name="Heart" size={24} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentScreen('downloads')}
                className={currentScreen === 'downloads' ? 'text-primary' : ''}
              >
                <Icon name="Download" size={24} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
