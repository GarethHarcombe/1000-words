import { Town } from '@/constants/Types';
import { View, Text, TouchableOpacity, ScrollView } from '@/components/Themed';
import { StyleSheet, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { GradientButton } from '../StyledButtons';


type TownInfoProps = {
    town: Town;
    action: (town: Town) => void;
};

export default function TownInfo ({ town, action }: TownInfoProps) {
    
    const router = useRouter();

    function getStageColor(stage: number): string {
        switch (stage) {
            case 0:
              return '#a998a5';
            case 1:
              return '#c5a3a3';
            case 2:
              return '#e6d6a9';
            case 3:
              return '#a3b0ad';
            case 4:
              return '#93a7b1';
            case 5:
              return '#7d6e79';
            case 6:
              return '#55666f';
            case 7:
              return '#c5a46d';
            default:
              return '#e4dad1';
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
            return require('@/assets/images/town-images/cwtch.jpg');
          case 3:
            return require('@/assets/images/town-images/love_spoons.jpg');
          case 4:
            return require('@/assets/images/town-images/llanfaipg.jpg');
          case 5:
            return require('@/assets/images/town-images/bakery.jpg');
          case 6:
            return require('@/assets/images/town-images/principality_stadium.jpg');
          default:
            return require('@/assets/images/splash-icon.png');
        }
    };

    return (
    <ScrollView style={styles.townDetailsContainer}>
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
            
            <GradientButton
              style={styles.actionButton}
              onPress={() => router.push({ pathname: '/TownFlashcardsScreen', params: { id: town.groupID } })}
            >
              <Text style={styles.actionButtonText}>Travel Here and Learn {town.group} themed words!</Text>
            </GradientButton>
        </View>
    </ScrollView>
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
    height: 400,
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
    // The container has a fixed height; keep it
    height: 40,
  },
  actionButton: {
    flex: 1,              // fill available horizontal space
    alignSelf: 'stretch', // fill the container’s height
    height: '100%',       // defensive when parent has explicit height
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    // remove paddingVertical if you want exact 40px tall
    // paddingVertical: 12,
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