//
//  CurrenseeSharedRates.m
//  CurrencyCamera
//
//  Created by Andreea Nuta on 10.10.2025.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CurrenseeSharedRates, NSObject)
RCT_EXTERN_METHOD(saveFavorites:(NSString *)favoritesJson)
RCT_EXTERN_METHOD(readFavoritesCount:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
