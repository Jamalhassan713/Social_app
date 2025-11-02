enum roleEnum {
    User = 'user',
    ADMIN = 'admin'
}

enum genderEnum {
    MALE = 'male',
    FEMALE = 'female'
}
enum providerEnum {
    GOOGLE = 'google',
    LOCAL = 'local'
}
enum otpTypesEnum {
    CONFIRMATION = 'confirmation',
    RESET_PASSWORD = 'reset_password',
    UPDATE_EMAIL = 'update email',
    TWO_FACTOR_AUTH = 'two factor auth'
}
enum friendShipStatusEnum {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected'
}
enum conversationEnum {
    DIRECT = 'direct',
    GROUP = 'group'
}
enum reactEnum {
    LIKE = '👍',
    LOVE = '❤️',
    HAHA = '😂',
    WOW = '😮',
    SAD = '😢',
    ANGRY = '😡'
}

export { roleEnum, genderEnum, providerEnum, otpTypesEnum, friendShipStatusEnum, conversationEnum, reactEnum }