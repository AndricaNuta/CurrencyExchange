#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNPriceOCR, NSObject)

RCT_EXTERN_METHOD(ping:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(detectTextInImage:(NSString *)uri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
