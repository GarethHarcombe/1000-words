import { Town } from '@/constants/Types';
import { View, Text, TouchableOpacity } from '@/components/Themed';
import { StyleSheet, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';


type TownInfoProps = {
    town: Town;
    action: (town: Town) => void;
};

export default function TownInfo ({ town, action }: TownInfoProps) {
    
    const router = useRouter();

    function getStageColor(stage: number): string {
        switch (stage) {
            case 0:
            return '#ccc';
            case 1:
            return '#ffcc00';
            case 2:
            return '#3399ff';
            case 3:
            return '#33cc66';
            default:
            return '#ccc';
        }
    }

    // Get placeholder image based on town stage
    const getTownPlaceholderImage = (stage: number) => {
        switch (stage) {
          case 0:
            return require('@/assets/images/caravan.jpg');
          case 1:
            return require('@/assets/images/town-images/conwy.jpg');
          case 2:
            return require('@/assets/images/caravan.jpg');
          case 3:
            return require('@/assets/images/caravan.jpg');
          case 4:
            return require('@/assets/images/town-images/llanfaipg.jpg');
          case 5:
            return require('@/assets/images/town-images/llanfaipg.jpg');
          case 6:
            return require('@/assets/images/town-images/bakery.jpg');
          default:
            return require('@/assets/images/caravan.jpg');
        }
    };

    return (
    <View style={styles.townDetailsContainer}>
        <View style={styles.townHeader}>
            <Text style={styles.townName}>{town.name}</Text>
            <View style={[styles.stageBadge, { backgroundColor: getStageColor(town.stage) }]}>
                <Text style={styles.stageText}>{town.group}</Text>
            </View>
        </View>
        
        <View style={styles.townImageContainer}>
            <Image
                source={town.imagePath ? { uri: town.imagePath } : getTownPlaceholderImage(town.stage)}
                style={styles.townImage}
                resizeMode="cover"
            />
        </View>
        
        <Text style={styles.townDescription}>{town.description}</Text>
        
        <View style={styles.actionsContainer}>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push({ pathname: '/TownFlashcardsScreen', params: { id: town.stage } })}
            >
              <Text style={styles.actionButtonText}>Travel Here and Learn</Text>
            </TouchableOpacity>
        </View>
    </View>
    )
};

const styles = StyleSheet.create({
  townDetailsContainer: {
    // flex: 1,
  },
  townHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  townName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stageText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  townImageContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  townImage: {
    width: '100%',
    height: '100%',
  },
  townDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto', // Push to bottom
    height: 40, // Fixed height for buttons
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3399ff',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
});